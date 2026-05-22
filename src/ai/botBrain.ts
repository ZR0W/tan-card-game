/**
 * BotBrain — shared AI-selector type used by both the web UI and CLI.
 *
 * Adding a new brain: extend the union, add entries in BOT_BRAIN_LABELS and
 * BOT_BRAIN_OPTIONS, add a case in pickBotMove. Nothing else needs to change.
 */

import type { GameState, PlayerId } from "@engine/gameState";
import type { Move } from "@engine/rules";
import { getLegalMoves, getWinner } from "@engine/rules";
import { createRng } from "@engine/rng";
import { chooseGreedyMove } from "./heuristicBot";
import { chooseMctsMove } from "./mcts";

export type BotBrain = "random" | "greedy" | "mcts-fast" | "mcts";

export const BOT_BRAIN_OPTIONS: readonly BotBrain[] = [
  "random",
  "greedy",
  "mcts-fast",
  "mcts",
];

export const BOT_BRAIN_LABELS: Record<BotBrain, string> = {
  random: "Random (uniform)",
  greedy: "Greedy (instant)",
  "mcts-fast": "MCTS · 25 sims",
  mcts: "MCTS · 100 sims",
};

/** Simulations-per-move used by each MCTS brain variant (mutable for CLI override). */
export const BOT_BRAIN_SIMS: Partial<Record<BotBrain, number>> = {
  "mcts-fast": 25,
  mcts: 100,
};

/**
 * Returns true when the brain runs MCTS simulations (and --sims applies).
 */
export function isMctsBrain(brain: BotBrain): boolean {
  return brain === "mcts" || brain === "mcts-fast";
}

/**
 * Picks the best move for `player` using `brain`.
 *
 * `rngSeed` is forwarded to random / MCTS brains for reproducibility;
 * omit it (or pass `undefined`) for non-deterministic behaviour.
 */
export function pickBotMove(
  state: GameState,
  player: PlayerId,
  brain: BotBrain,
  rngSeed?: number
): Move | null {
  if (getWinner(state) !== null) return null;

  switch (brain) {
    case "random": {
      const moves = getLegalMoves(state);
      if (moves.length === 0) return null;
      const rng = createRng(rngSeed ?? Math.trunc(Math.random() * 0xffff_ffff));
      return moves[rng.nextInt(0, moves.length - 1)]!;
    }

    case "greedy":
      return chooseGreedyMove(state, player);

    case "mcts-fast":
      return chooseMctsMove(state, player, {
        simulations: BOT_BRAIN_SIMS["mcts-fast"],
        seed: rngSeed,
        enableAuditLog: false,
      }).bestMove;

    case "mcts":
      return chooseMctsMove(state, player, {
        simulations: BOT_BRAIN_SIMS["mcts"],
        seed: rngSeed,
        enableAuditLog: false,
      }).bestMove;
  }
}
