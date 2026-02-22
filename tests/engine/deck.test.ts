import { describe, it, expect } from "vitest";
import {
  createDeck,
  shuffle,
  draw,
  createRng,
} from "../../src/engine";

describe("deck", () => {
  describe("createDeck", () => {
    it("returns 52 cards", () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it("all cards are unique (no duplicate suit+rank)", () => {
      const deck = createDeck();
      const keys = new Set(deck.map((c) => `${c.suit}:${c.rank}`));
      expect(keys.size).toBe(52);
    });
  });

  describe("shuffle", () => {
    it("same seed produces same order", () => {
      const deck1 = createDeck();
      const deck2 = createDeck();
      const rng1 = createRng(777);
      const rng2 = createRng(777);
      const shuffled1 = shuffle(deck1, rng1);
      const shuffled2 = shuffle(deck2, rng2);
      expect(shuffled1).toHaveLength(52);
      expect(shuffled2).toHaveLength(52);
      for (let i = 0; i < 52; i++) {
        expect(shuffled1[i].suit).toBe(shuffled2[i].suit);
        expect(shuffled1[i].rank).toBe(shuffled2[i].rank);
      }
    });

    it("different seeds produce different order", () => {
      const deck1 = createDeck();
      const deck2 = createDeck();
      const shuffled1 = shuffle(deck1, createRng(1));
      const shuffled2 = shuffle(deck2, createRng(2));
      const sameOrder = shuffled1.every(
        (c, i) => c.suit === shuffled2[i].suit && c.rank === shuffled2[i].rank
      );
      expect(sameOrder).toBe(false);
    });

    it("shuffle does not mutate original deck", () => {
      const deck = createDeck();
      const copy = deck.map((c) => ({ ...c }));
      shuffle(deck, createRng(0));
      expect(deck).toEqual(copy);
    });
  });

  describe("draw", () => {
    it("draws from top and returns remaining", () => {
      const deck = createDeck();
      const first = deck[0];
      const result = draw(deck);
      expect(result).toBeDefined();
      expect(result!.card).toEqual(first);
      expect(result!.remaining).toHaveLength(51);
    });

    it("draw order after shuffle is deterministic for same seed", () => {
      const deck1 = shuffle(createDeck(), createRng(123));
      const deck2 = shuffle(createDeck(), createRng(123));
      const drawn1: typeof deck1 = [];
      const drawn2: typeof deck2 = [];
      let d1: ReturnType<typeof draw> = draw(deck1);
      let d2: ReturnType<typeof draw> = draw(deck2);
      while (d1 && d2) {
        drawn1.push(d1.card);
        drawn2.push(d2.card);
        expect(d1.card.suit).toBe(d2.card.suit);
        expect(d1.card.rank).toBe(d2.card.rank);
        d1 = draw(d1.remaining);
        d2 = draw(d2.remaining);
      }
      expect(drawn1).toHaveLength(52);
      expect(drawn2).toHaveLength(52);
    });

    it("after 52 draws deck is empty", () => {
      let deck = shuffle(createDeck(), createRng(0));
      for (let i = 0; i < 52; i++) {
        const result = draw(deck);
        expect(result).toBeDefined();
        deck = result!.remaining;
      }
      expect(deck).toHaveLength(0);
      expect(draw(deck)).toBeUndefined();
    });

    it("draw does not mutate deck", () => {
      const deck = createDeck();
      const before = [...deck];
      draw(deck);
      expect(deck).toEqual(before);
    });
  });
});
