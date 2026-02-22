import type { Card, Suit } from "./types";
import { createDeck, draw, shuffle } from "./deck";
import { createRng } from "./rng";

/** Player index (2-player). */
export type PlayerId = 0 | 1;

export interface PlayerState {
  id: PlayerId;
  hand: Card[];
  score: number;
}

/** Phase of the game for state machine / rules. */
export type Phase =
  | "attacker_lead"
  | "defender_respond"
  | "draw"
  | "game_over";

export interface CurrentRound {
  attacks: Card[];
  defences: Card[];
}

export interface GameState {
  deck: Card[];
  trumpSuit: Suit;
  turnUpCard: Card;
  players: [PlayerState, PlayerState];
  currentAttacker: PlayerId;
  currentDefender: PlayerId;
  currentRound: CurrentRound;
  discardPile: Card[];
  phase: Phase;
  /** Set when phase is game_over (first to 0 cards after draw). */
  winner?: PlayerId;
}

/**
 * Creates an initial game state: shuffled deck, deal 8 each, turn-up sets trump,
 * player 0 is first attacker. All plain data for JSON-safe serialization.
 */
export function createInitialGameState(seed: number): GameState {
  const shuffled = shuffle(createDeck(), createRng(seed));

  let deck: Card[] = shuffled;
  const hand0: Card[] = [];
  const hand1: Card[] = [];

  for (let i = 0; i < 8; i++) {
    const r0 = draw(deck);
    if (!r0) break;
    hand0.push(r0.card);
    deck = r0.remaining;
  }
  for (let i = 0; i < 8; i++) {
    const r1 = draw(deck);
    if (!r1) break;
    hand1.push(r1.card);
    deck = r1.remaining;
  }

  const turnUpCard = deck[deck.length - 1];
  const trumpSuit = turnUpCard.suit;

  return {
    deck,
    trumpSuit,
    turnUpCard,
    players: [
      { id: 0, hand: hand0, score: 0 },
      { id: 1, hand: hand1, score: 0 },
    ],
    currentAttacker: 0,
    currentDefender: 1,
    currentRound: { attacks: [], defences: [] },
    discardPile: [],
    phase: "attacker_lead",
  };
}
