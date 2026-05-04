import {
  applyMove,
  createRng,
  getLegalMoves,
  getWinner,
} from "@engine/index";
import type { Rng } from "@engine/rng";
import type { Move } from "@engine/rules";
import type { GameState } from "@engine/gameState";
import { buildLogEvents } from "../ui/gameLog";

/** Offset from deal seed for bot RNG so UI sessions stay reproducible for a given seed. */
export const BOT_PLAY_RNG_OFFSET = 77_007;

export function shouldBotAct(state: GameState, vsBot: boolean): boolean {
  if (!vsBot) return false;
  if (state.phase === "draw") return true;
  if (state.phase === "attacker_lead") return state.currentAttacker === 1;
  if (state.phase === "defender_respond") return state.currentDefender === 1;
  return false;
}

/** Random legal move (production bot path until Epic 4 MC). */
export function pickRandomLegalMove(state: GameState, rng: Rng): Move | null {
  const moves = getLegalMoves(state);
  if (moves.length === 0) return null;
  return moves[rng.nextInt(0, moves.length - 1)]!;
}

/**
 * Applies `move` then any chained bot moves; collects `buildLogEvents` for each atomic transition.
 * Bot moves use `pickRandomLegalMove` (not greedy heuristic — see README Epic 3 / 4 bridge).
 */
export function advanceSession(
  prev: GameState,
  move: Move,
  vsBot: boolean,
  botRng: Rng
): { next: GameState; events: string[] } {
  const events: string[] = [];
  let next = applyMove(prev, move);
  events.push(...buildLogEvents(prev, move, next));

  while (
    vsBot &&
    getWinner(next) === null &&
    shouldBotAct(next, vsBot)
  ) {
    const bm = pickRandomLegalMove(next, botRng);
    if (!bm) break;
    const before = next;
    next = applyMove(next, bm);
    events.push(...buildLogEvents(before, bm, next));
  }

  return { next, events };
}

/** Fresh RNG stream for bot moves after a new deal (same `seed` as `createInitialGameState`). */
export function createBotPlayRng(seed: number): Rng {
  return createRng(seed + BOT_PLAY_RNG_OFFSET);
}
