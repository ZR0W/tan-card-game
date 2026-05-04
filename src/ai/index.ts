/**
 * Epic 3 AI exports. Greedy / scalar eval read full `GameState` (clairvoyant on opponent hand);
 * not used for production bot — see module comments and README Epic 4 bridge.
 */
export type { EvalMetrics } from "./metrics";
export { evaluateMetrics } from "./metrics";
export { METRIC_WEIGHTS, combineMetrics, evaluateState } from "./evaluation";
export { chooseGreedyMove } from "./heuristicBot";
