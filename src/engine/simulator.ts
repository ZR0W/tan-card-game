import type { GameState } from "./gameState";
import type { Rng } from "./rng";
import { createInitialGameState } from "./gameState";
import { createRng } from "./rng";
import { getLegalMoves, applyMove, getWinner } from "./rules";

/**
 * Deep-clones game state so simulations (or AI) can run from a copy
 * without mutating the original. GameState is plain data.
 */
export function cloneGameState(state: GameState): GameState {
  return structuredClone(state);
}

/**
 * Runs from the given state until the game is over, choosing a random
 * legal move at each step. Returns the final state (with winner set).
 * Reusable for playouts from any state (e.g. AI).
 */
export function runFromState(state: GameState, rng: Rng): GameState {
  let s = state;
  while (true) {
    const winner = getWinner(s);
    if (winner !== null) return s;
    const moves = getLegalMoves(s);
    if (moves.length === 0) return s;
    const idx = rng.nextInt(0, moves.length - 1);
    s = applyMove(s, moves[idx]);
  }
}

/**
 * Runs a full random game from a seed: initial state from seed, move
 * choices from a separate RNG (seed + 1) so same seed → same outcome.
 */
export function simulateRandomGame(seed: number): GameState {
  const state = createInitialGameState(seed);
  const rng = createRng(seed + 1);
  return runFromState(state, rng);
}
