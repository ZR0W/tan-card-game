import { describe, it, expect } from "vitest";
import { createInitialGameState } from "../../src/engine";

describe("gameState", () => {
  describe("createInitialGameState", () => {
    it("produces valid initial state shape", () => {
      const state = createInitialGameState(42);

      expect(state.deck).toHaveLength(36);
      expect(state.players[0].hand).toHaveLength(8);
      expect(state.players[1].hand).toHaveLength(8);
      expect(state.players[0].id).toBe(0);
      expect(state.players[1].id).toBe(1);
      expect(state.players[0].score).toBe(0);
      expect(state.players[1].score).toBe(0);

      expect(state.trumpSuit).toBe(state.turnUpCard.suit);
      expect(state.deck[state.deck.length - 1]).toEqual(state.turnUpCard);

      expect(state.currentAttacker).toBe(0);
      expect(state.currentDefender).toBe(1);
      expect(state.currentRound.attacks).toHaveLength(0);
      expect(state.currentRound.defences).toHaveLength(0);
      expect(state.discardPile).toHaveLength(0);
      expect(state.phase).toBe("attacker_lead");
    });

    it("same seed produces same state (determinism)", () => {
      const a = createInitialGameState(123);
      const b = createInitialGameState(123);

      expect(a.deck).toEqual(b.deck);
      expect(a.players[0].hand).toEqual(b.players[0].hand);
      expect(a.players[1].hand).toEqual(b.players[1].hand);
      expect(a.trumpSuit).toBe(b.trumpSuit);
      expect(a.turnUpCard).toEqual(b.turnUpCard);
    });

    it("different seeds produce different state", () => {
      const a = createInitialGameState(1);
      const b = createInitialGameState(2);

      const sameHands =
        a.players[0].hand.every(
          (c, i) =>
            c.suit === b.players[0].hand[i]?.suit &&
            c.rank === b.players[0].hand[i]?.rank
        ) &&
        a.players[1].hand.every(
          (c, i) =>
            c.suit === b.players[1].hand[i]?.suit &&
            c.rank === b.players[1].hand[i]?.rank
        );
      expect(sameHands).toBe(false);
    });

    it("state is JSON-safe (round-trip preserves key fields)", () => {
      const state = createInitialGameState(999);
      const json = JSON.stringify(state);
      const restored = JSON.parse(json) as typeof state;

      expect(restored.deck).toEqual(state.deck);
      expect(restored.players).toEqual(state.players);
      expect(restored.trumpSuit).toBe(state.trumpSuit);
      expect(restored.turnUpCard).toEqual(state.turnUpCard);
      expect(restored.currentAttacker).toBe(state.currentAttacker);
      expect(restored.currentDefender).toBe(state.currentDefender);
      expect(restored.currentRound).toEqual(state.currentRound);
      expect(restored.discardPile).toEqual(state.discardPile);
      expect(restored.phase).toBe(state.phase);
    });
  });
});
