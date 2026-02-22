import { allCards } from "./card";
import type { Card } from "./types";
import type { Rng } from "./rng";

/**
 * Returns a new deck of 52 unique cards in fixed order (suit then rank).
 * No randomness; shuffle separately with shuffle().
 */
export function createDeck(): Card[] {
  return [...allCards()];
}

/**
 * Fisher–Yates shuffle using the provided RNG. Returns a new array.
 * Same seed → same order. Use once when deck is ready; draw has no RNG.
 */
export function shuffle(deck: Card[], rng: Rng): Card[] {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.nextInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draw the top card from the deck. Deterministic (no RNG).
 * Returns the card and the remaining deck, or undefined if deck is empty.
 */
export function draw(
  deck: Card[]
): { card: Card; remaining: Card[] } | undefined {
  if (deck.length === 0) return undefined;
  const [card, ...remaining] = deck;
  return { card, remaining };
}
