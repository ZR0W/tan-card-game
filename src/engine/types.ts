/**
 * Card and deck types for the tan game engine.
 * Rank order per PROJECT_PLAN: 2..10, J, Q, K, A (Ace high).
 */

export const Suits = [
  "Clubs",
  "Diamonds",
  "Hearts",
  "Spades",
] as const;

export type Suit = (typeof Suits)[number];

export const Ranks = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "Jack",
  "Queen",
  "King",
  "Ace",
] as const;

export type Rank = (typeof Ranks)[number];

export interface Card {
  suit: Suit;
  rank: Rank;
}
