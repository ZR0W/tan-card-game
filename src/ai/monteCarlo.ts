import type { Card } from "@engine/types";
import type { GameState, PlayerId } from "@engine/gameState";
import {
  applyMove,
  getLegalMoves,
  getWinner,
} from "@engine/rules";
import type { Move } from "@engine/rules";
import { cloneGameState, runFromState } from "@engine/simulator";
import { createRng } from "@engine/rng";
import { generateDeterminizedState } from "./determinization";

/** K determinizations × N rollouts per candidate move (total budget `K * N` per legal move). */
export interface MonteCarloConfig {
  K: number;
  N: number;
}

/** Default meets README “100+ sims” as 8 × 16 = 128 rollouts per candidate. */
export const DEFAULT_MONTE_CARLO_CONFIG: MonteCarloConfig = {
  K: 8,
  N: 16,
};

/** Stable string key for a move (matches sort / tie-break order). */
export function moveSortKey(m: Move): string {
  switch (m.type) {
    case "attack":
      return `attack:${m.cardIndex}`;
    case "defend":
      return `defend:${m.cardIndex}`;
    case "draw":
      return "draw";
    case "give_up":
      return "give_up";
    case "pass_attack":
      return "pass_attack";
    default: {
      const _x: never = m;
      return String(_x);
    }
  }
}

function compareMoves(a: Move, b: Move): number {
  return moveSortKey(a).localeCompare(moveSortKey(b));
}

function sameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

/**
 * Map a move from `source` (true layout) to the same logical action on `det` (same phase/roles).
 * Needed because attack/defend use hand indices; opponent hand order differs after determinization.
 */
export function resolveMoveForDeterminized(
  move: Move,
  source: GameState,
  det: GameState
): Move | null {
  if (move.type === "attack") {
    const pid = source.currentAttacker;
    const card = source.players[pid].hand[move.cardIndex];
    if (!card) return null;
    const idx = det.players[pid].hand.findIndex((c) => sameCard(c, card));
    if (idx < 0) return null;
    return { type: "attack", cardIndex: idx };
  }
  if (move.type === "defend") {
    const pid = source.currentDefender;
    const card = source.players[pid].hand[move.cardIndex];
    if (!card) return null;
    const idx = det.players[pid].hand.findIndex((c) => sameCard(c, card));
    if (idx < 0) return null;
    return { type: "defend", cardIndex: idx };
  }
  return move;
}

function detRngSeed(workSalt: number, moveIdx: number, k: number): number {
  return (workSalt * 1_000_003 + moveIdx * 10_007 + k * 193_499) >>> 0;
}

function rolloutRngSeed(workSalt: number, moveIdx: number, k: number, n: number): number {
  return (detRngSeed(workSalt, moveIdx, k) + n * 524_287 + 1) >>> 0;
}

/** Per-candidate rollout stats for one `chooseMonteCarloMove` call. */
export interface MonteCarloCandidateStats {
  moveKey: string;
  wins: number;
  rolloutsDone: number;
  mean: number;
  /** Count of determinization indices `k` where resolve failed or `applyMove` threw (no rollouts added). */
  skippedDeterminizations: number;
}

/** JSON-friendly snapshot emitted once per successful MC decision (optional `onDecision`). */
export interface MonteCarloDecisionRecord {
  viewer: PlayerId;
  workSalt: number;
  config: MonteCarloConfig;
  phase: GameState["phase"];
  currentAttacker: PlayerId;
  currentDefender: PlayerId;
  candidates: MonteCarloCandidateStats[];
  chosen: Move;
  chosenMean: number;
}

export interface MonteCarloChooseOptions {
  onDecision?: (record: MonteCarloDecisionRecord) => void;
}

/**
 * Monte Carlo move choice: for each legal move, average win rate for `viewer` over K
 * determinized worlds × N random rollouts each. Never scores the live hidden deal; each
 * rollout starts from `generateDeterminizedState` then applies the candidate move.
 *
 * `workSalt` must change between bot decisions (caller-owned counter) so RNG streams differ.
 */
export function chooseMonteCarloMove(
  state: GameState,
  viewer: PlayerId,
  config: MonteCarloConfig,
  workSalt: number,
  options?: MonteCarloChooseOptions
): Move | null {
  if (getWinner(state) !== null) return null;
  const moves = [...getLegalMoves(state)].sort(compareMoves);
  if (moves.length === 0) return null;

  const candidates: MonteCarloCandidateStats[] = [];
  let best: Move = moves[0]!;
  let bestMean = -1;

  for (let mi = 0; mi < moves.length; mi++) {
    const move = moves[mi]!;
    let wins = 0;
    let rolloutsDone = 0;
    let skippedDeterminizations = 0;

    for (let k = 0; k < config.K; k++) {
      const det = generateDeterminizedState(
        state,
        viewer,
        createRng(detRngSeed(workSalt, mi, k))
      );
      const resolved = resolveMoveForDeterminized(move, state, det);
      if (resolved === null) {
        skippedDeterminizations += 1;
        continue;
      }
      let afterCandidate: GameState;
      try {
        afterCandidate = applyMove(cloneGameState(det), resolved);
      } catch {
        skippedDeterminizations += 1;
        continue;
      }
      for (let n = 0; n < config.N; n++) {
        const terminal = runFromState(
          afterCandidate,
          createRng(rolloutRngSeed(workSalt, mi, k, n))
        );
        rolloutsDone += 1;
        const w = getWinner(terminal);
        if (w === viewer) wins += 1;
      }
    }

    const mean = rolloutsDone > 0 ? wins / rolloutsDone : 0;
    candidates.push({
      moveKey: moveSortKey(move),
      wins,
      rolloutsDone,
      mean,
      skippedDeterminizations,
    });
    if (mean > bestMean) {
      bestMean = mean;
      best = move;
    }
  }

  if (options?.onDecision) {
    options.onDecision({
      viewer,
      workSalt,
      config: { K: config.K, N: config.N },
      phase: state.phase,
      currentAttacker: state.currentAttacker,
      currentDefender: state.currentDefender,
      candidates,
      chosen: best,
      chosenMean: bestMean,
    });
  }

  return best;
}
