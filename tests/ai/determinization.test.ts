import { describe, it, expect } from "vitest";
import {
  createInitialGameState,
  createRng,
  getLegalMoves,
  applyMove,
  getWinner,
  allCards,
} from "../../src/engine";
import type { Card } from "../../src/engine";
import { generateDeterminizedState } from "../../src/ai/determinization";

function cardKey(c: Card): string {
  return `${c.suit}:${c.rank}`;
}

function cardSet(cards: Card[]): Set<string> {
  return new Set(cards.map(cardKey));
}

describe("generateDeterminizedState", () => {
  it("preserves perspective player's own hand exactly", () => {
    const state = createInitialGameState(42);
    const rng = createRng(1);
    const det = generateDeterminizedState(state, 0, rng);
    expect(det.players[0].hand).toEqual(state.players[0].hand);
  });

  it("opponent hand size is unchanged", () => {
    const state = createInitialGameState(42);
    const rng = createRng(1);
    const det = generateDeterminizedState(state, 0, rng);
    expect(det.players[1].hand.length).toBe(state.players[1].hand.length);
  });

  it("deck size is unchanged", () => {
    const state = createInitialGameState(42);
    const rng = createRng(1);
    const det = generateDeterminizedState(state, 0, rng);
    expect(det.deck.length).toBe(state.deck.length);
  });

  it("no cards are duplicated or lost — full 52-card universe is conserved", () => {
    const state = createInitialGameState(7);
    const rng = createRng(99);
    const det = generateDeterminizedState(state, 0, rng);

    const all = [
      ...det.players[0].hand,
      ...det.players[1].hand,
      ...det.deck,
      ...det.currentRound.attacks,
      ...det.currentRound.defences,
      ...det.discardPile,
    ];
    const keys = all.map(cardKey);
    const unique = new Set(keys);
    expect(unique.size).toBe(52);
    expect(keys.length).toBe(52);
  });

  it("known cards (current round + discard) are unchanged", () => {
    // Advance to a state that has round cards on the table.
    let state = createInitialGameState(5);
    const attack = getLegalMoves(state).find((m) => m.type === "attack")!;
    state = applyMove(state, attack);
    // currentRound.attacks now has one card; phase is defender_respond.
    expect(state.currentRound.attacks.length).toBe(1);

    const rng = createRng(77);
    const det = generateDeterminizedState(state, 1, rng); // defender's perspective
    expect(det.currentRound.attacks).toEqual(state.currentRound.attacks);
  });

  it("same seed produces identical determinization", () => {
    const state = createInitialGameState(100);
    const det1 = generateDeterminizedState(state, 0, createRng(55));
    const det2 = generateDeterminizedState(state, 0, createRng(55));
    expect(det1.players[1].hand).toEqual(det2.players[1].hand);
    expect(det1.deck).toEqual(det2.deck);
  });

  it("different seeds produce different opponent hands (with high probability)", () => {
    const state = createInitialGameState(100);
    const det1 = generateDeterminizedState(state, 0, createRng(1));
    const det2 = generateDeterminizedState(state, 0, createRng(2));
    // It's extremely unlikely that two independent shuffles produce identical hands.
    const same = det1.players[1].hand.every(
      (c, i) => cardKey(c) === cardKey(det2.players[1].hand[i]!)
    );
    expect(same).toBe(false);
  });

  it("opponent hand cards come from the pool (not from bot's hand)", () => {
    const state = createInitialGameState(42);
    const rng = createRng(1);
    const det = generateDeterminizedState(state, 0, rng);

    const botHandKeys = cardSet(det.players[0].hand);
    for (const c of det.players[1].hand) {
      expect(botHandKeys.has(cardKey(c))).toBe(false);
    }
  });

  it("deck after determinization contains no card already in a hand or round", () => {
    const state = createInitialGameState(42);
    const rng = createRng(1);
    const det = generateDeterminizedState(state, 0, rng);

    const occupied = new Set<string>([
      ...det.players[0].hand,
      ...det.players[1].hand,
      ...det.currentRound.attacks,
      ...det.currentRound.defences,
      ...det.discardPile,
    ].map(cardKey));

    for (const c of det.deck) {
      expect(occupied.has(cardKey(c))).toBe(false);
    }
  });

  it("works correctly from defender's perspective", () => {
    const state = createInitialGameState(9);
    const rng = createRng(3);
    const det = generateDeterminizedState(state, 1, rng); // perspective = defender (player 1)

    // Defender's own hand is unchanged.
    expect(det.players[1].hand).toEqual(state.players[1].hand);

    // Attacker hand size is preserved.
    expect(det.players[0].hand.length).toBe(state.players[0].hand.length);

    // No card duplicates.
    const all = [
      ...det.players[0].hand,
      ...det.players[1].hand,
      ...det.deck,
      ...det.currentRound.attacks,
      ...det.currentRound.defences,
      ...det.discardPile,
    ].map(cardKey);
    expect(new Set(all).size).toBe(52);
  });

  it("determinized state is still playable to completion", () => {
    const state = createInitialGameState(77);
    const rng = createRng(10);
    let s = generateDeterminizedState(state, 0, rng);
    const playRng = createRng(20);
    let depth = 0;
    while (getWinner(s) === null && depth < 500) {
      const moves = getLegalMoves(s);
      expect(moves.length).toBeGreaterThan(0);
      const idx = playRng.nextInt(0, moves.length - 1);
      s = applyMove(s, moves[idx]!);
      depth++;
    }
    expect(getWinner(s)).not.toBeNull();
  });
});
