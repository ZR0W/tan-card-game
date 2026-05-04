/**
 * @deprecatedForProduction — `evaluateState` delegates to `evaluateMetrics`, which reads
 * the opponent’s **hidden** hand on the real `GameState`. That is clairvoyant for imperfect
 * information and must **not** drive production move selection on the true state.
 *
 * Still useful for: unit tests, and (after Epic 4) scoring **determinized** worlds where
 * the full state is an explicit sample, not omniscience.
 */
import type { GameState, PlayerId } from "@engine/gameState";
import { getWinner } from "@engine/rules";
import type { EvalMetrics } from "./metrics";
import { evaluateMetrics } from "./metrics";

/** Tunable weights for combining metrics (single place to rebalance heuristics). */
export const METRIC_WEIGHTS: Record<keyof EvalMetrics, number> = {
  handEconomy: 1.1,
  trumpEquity: 0.85,
  rankStrength: 1.0,
  roundPressure: 1.0,
  phaseUtility: 0.9,
};

const TERMINAL_WIN = 10_000;
const TERMINAL_LOSS = -10_000;

export function combineMetrics(m: EvalMetrics): number {
  let s = 0;
  (Object.keys(METRIC_WEIGHTS) as (keyof EvalMetrics)[]).forEach((k) => {
    s += METRIC_WEIGHTS[k] * m[k];
  });
  return s;
}

/**
 * Scalar score for minimax-style search: higher is better for `player`.
 * Terminal positions dominate heuristic noise.
 *
 * **Not for production bot on live `GameState`** — see file comment.
 */
export function evaluateState(state: GameState, player: PlayerId): number {
  const w = getWinner(state);
  if (w !== null) return w === player ? TERMINAL_WIN : TERMINAL_LOSS;
  return combineMetrics(evaluateMetrics(state, player));
}
