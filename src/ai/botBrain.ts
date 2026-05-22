/**
 * BotBrain — shared AI-selector type used by both the web UI and CLI.
 *
 * Adding a new brain: extend the union, add an entry in BOT_BRAIN_LABELS,
 * add a case in pickBotMove. Nothing else needs to change.
 */

import type { GameState, PlayerId } from "@engine/gameState";
import type { Move } from "@engine/rules";
import { getWinner } from "@engine/rules";
import { chooseGreedyMove } from "./heuristicBot";
import { chooseMctsMove } from "./mcts";

export type BotBrain = "greedy" | "mcts-fast" | "mcts";

export const BOT_BRAIN_OPTIONS: readonly BotBrain[] = [
  "greedy",
  "mcts-fast",
  "mcts",
];

export const BOT_BRAIN_LABELS: Record<BotBrain, string> = {
  greedy: "Greedy (instant)",
  "mcts-fast": "MCTS · 25 sims",
  mcts: "MCTS · 100 sims",
};

/** Simulations-per-move used by each MCTS brain variant. */
export const BOT_BRAIN_SIMS: Partial<Record<BotBrain, number>> = {
  "mcts-fast": 25,
  mcts: 100,
};

/**
 * Picks the best move for `player` using `brain`.
 *
 * `rngSeed` is forwarded to MCTS so callers can make results reproducible;
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
