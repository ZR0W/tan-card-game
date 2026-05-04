import { describe, it, expect } from "vitest";
import { createInitialGameState, createRng } from "../../src/engine";
import type { GameState } from "../../src/engine/gameState";
import { generateDeterminizedState } from "../../src/ai/determinization";
import { allCards } from "../../src/engine/card";

function multisetKey(c: { suit: string; rank: string }): string {
  return `${c.suit}\t${c.rank}`;
}

function allCardsInState(s: GameState): string[] {
  const keys: string[] = [];
  for (const c of s.players[0].hand) keys.push(multisetKey(c));
  for (const c of s.players[1].hand) keys.push(multisetKey(c));
  for (const c of s.currentRound.attacks) keys.push(multisetKey(c));
  for (const c of s.currentRound.defences) keys.push(multisetKey(c));
  for (const c of s.discardPile) keys.push(multisetKey(c));
  for (const c of s.deck) keys.push(multisetKey(c));
  keys.sort();
  return keys;
}

describe("generateDeterminizedState", () => {
  it("is reproducible for the same seed and viewer", () => {
    const state = createInitialGameState(42);
    const a = generateDeterminizedState(state, 0, createRng(999));
    const b = generateDeterminizedState(state, 0, createRng(999));
    expect(a.players[0].hand).toEqual(b.players[0].hand);
    expect(a.players[1].hand).toEqual(b.players[1].hand);
    expect(a.deck).toEqual(b.deck);
  });

  it("preserves viewer hand, public zones, turn-up, and deck length", () => {
    const state = createInitialGameState(7);
    const det = generateDeterminizedState(state, 0, createRng(1));
    expect(det.players[0].hand).toEqual(state.players[0].hand);
    expect(det.currentRound).toEqual(state.currentRound);
    expect(det.discardPile).toEqual(state.discardPile);
    expect(det.turnUpCard).toEqual(state.turnUpCard);
    expect(det.deck.length).toBe(state.deck.length);
    expect(det.deck[det.deck.length - 1]).toEqual(state.turnUpCard);
    expect(det.players[1].hand.length).toBe(state.players[1].hand.length);
  });

  it("uses exactly 52 unique cards matching the full deck multiset", () => {
    const state = createInitialGameState(11);
    const det = generateDeterminizedState(state, 1, createRng(55));
    const canon = allCards().map(multisetKey).sort();
    expect(allCardsInState(det).sort()).toEqual(canon);
  });

  it("viewer 1 path preserves P1 hand", () => {
    const state = createInitialGameState(3);
    const det = generateDeterminizedState(state, 1, createRng(88));
    expect(det.players[1].hand).toEqual(state.players[1].hand);
    expect(det.players[0].hand.length).toBe(state.players[0].hand.length);
  });

  it("different RNG seeds usually yield different sampled opponent hands", () => {
    const state = createInitialGameState(100);
    const a = generateDeterminizedState(state, 0, createRng(1));
    const b = generateDeterminizedState(state, 0, createRng(2));
    const same =
      JSON.stringify(a.players[1].hand) === JSON.stringify(b.players[1].hand);
    expect(same).toBe(false);
  });
});
