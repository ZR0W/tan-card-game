/**
 * Engine barrel: re-exports the public API so consumers can import from a single
 * entry point (e.g. `from "./engine"`) and the internal file layout can change.
 */
export { allCards, allRanks, allSuits, createCard, Ranks, Suits } from "./card";
export type { Card, Rank, Suit } from "./card";
export { createRng } from "./rng";
export type { Rng } from "./rng";
export { createDeck, draw, shuffle } from "./deck";
export { createInitialGameState } from "./gameState";
export type {
  CurrentRound,
  GameState,
  Phase,
  PlayerId,
  PlayerState,
} from "./gameState";
export {
  applyMove,
  cardBeats,
  getLegalMoves,
  getWinner,
  rankOrder,
} from "./rules";
export { IllegalMoveError } from "./rules";
export type { Move } from "./rules";
