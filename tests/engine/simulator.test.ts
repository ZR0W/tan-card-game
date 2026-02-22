import { describe, it, expect } from "vitest";
import {
  createInitialGameState,
  cloneGameState,
  runFromState,
  simulateRandomGame,
  getWinner,
  createRng,
} from "../../src/engine";

describe("simulator", () => {
  describe("cloneGameState", () => {
    it("returns a deep copy equal to the original", () => {
      const state = createInitialGameState(42);
      const cloned = cloneGameState(state);
      expect(cloned).toEqual(state);
      expect(cloned).not.toBe(state);
      expect(cloned.players).not.toBe(state.players);
      expect(cloned.deck).not.toBe(state.deck);
    });

    it("original is unchanged when clone is mutated later", () => {
      const state = createInitialGameState(1);
      const cloned = cloneGameState(state);
      cloned.phase = "game_over";
      cloned.winner = 0;
      expect(state.phase).toBe("attacker_lead");
      expect(state.winner).toBeUndefined();
    });
  });

  describe("runFromState", () => {
    it("runs until game over and returns state with winner", () => {
      const state = createInitialGameState(100);
      const rng = createRng(200);
      const final = runFromState(state, rng);
      expect(getWinner(final)).not.toBeNull();
      expect(final.phase).toBe("game_over");
      expect(final.winner).toBeDefined();
    });
  });

  describe("simulateRandomGame", () => {
    it("same seed produces same winner (determinism)", () => {
      const seed = 12345;
      const results = Array.from({ length: 10 }, () => simulateRandomGame(seed));
      const winners = results.map((s) => getWinner(s));
      expect(winners.every((w) => w === winners[0])).toBe(true);
      expect(results.every((s) => s.phase === "game_over")).toBe(true);
    });

    it("stress test: 1,000 runs all finish with game_over and winner", () => {
      const runs = 1000;
      for (let seed = 0; seed < runs; seed++) {
        const final = simulateRandomGame(seed);
        expect(final.phase).toBe("game_over");
        expect(final.winner).toBeDefined();
        expect(final.winner === 0 || final.winner === 1).toBe(true);
      }
    });
  });
});
