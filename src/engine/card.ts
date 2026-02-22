import type { Card, Rank, Suit } from "./types";
import { Ranks, Suits } from "./types";

export type { Card, Rank, Suit };
export { Ranks, Suits };

/**
 * All 13 ranks in game order (low to high).
 */
export const allRanks: readonly Rank[] = Ranks;

/**
 * All 4 suits.
 */
export const allSuits: readonly Suit[] = Suits;

/**
 * Creates a card. Useful for exhaustiveness and typing.
 */
export function createCard(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

/**
 * All 52 unique cards (every suit × rank). Order is fixed: by suit then rank.
 * Used as the canonical source for building a new deck.
 */
export function allCards(): Card[] {
  const cards: Card[] = [];
  for (const suit of allSuits) {
    for (const rank of allRanks) {
      cards.push(createCard(suit, rank));
    }
  }
  return cards;
}
