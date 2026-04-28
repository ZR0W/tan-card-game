import { describe, it, expect } from "vitest";
import {
  createInitialGameState,
  applyMove,
  getLegalMoves,
} from "../../src/engine";
import type { Move } from "../../src/engine/rules";
import {
  buildLogEvents,
  cardsAcquired,
  initialDealLines,
} from "../../src/ui/gameLog";

describe("gameLog", () => {
  describe("cardsAcquired", () => {
    it("returns empty when hands are identical", () => {
      const s = createInitialGameState(1);
      const h = s.players[0].hand;
      expect(cardsAcquired(h, [...h])).toEqual([]);
    });
  });

  describe("initialDealLines", () => {
    it("includes seed and trump-related text", () => {
      const state = createInitialGameState(42);
      const lines = initialDealLines(42, state);
      expect(lines[0]).toContain("42");
      expect(lines.some((l) => l.includes("Trump"))).toBe(true);
      expect(lines.some((l) => l.includes("Player 0 initial hand"))).toBe(true);
      expect(lines.some((l) => l.includes("Player 1 initial hand"))).toBe(true);
    });
  });

  describe("buildLogEvents", () => {
    it("logs attack and defender turn", () => {
      const prev = createInitialGameState(7);
      const moves = getLegalMoves(prev);
      const attack = moves.find((m): m is Extract<Move, { type: "attack" }> => m.type === "attack")!;
      const next = applyMove(prev, attack);
      const lines = buildLogEvents(prev, attack, next);
      expect(lines.some((l) => l.includes("Round started"))).toBe(true);
      expect(lines.some((l) => l.includes("attacked"))).toBe(true);
      expect(lines.some((l) => l.includes("defender"))).toBe(true);
    });

    it("logs draw phase refills", () => {
      let state = createInitialGameState(3);
      const attack = getLegalMoves(state).find((m) => m.type === "attack")!;
      state = applyMove(state, attack);
      state = applyMove(state, { type: "give_up" });
      expect(state.phase).toBe("draw");
      const next = applyMove(state, { type: "draw" });
      const lines = buildLogEvents(state, { type: "draw" }, next);
      expect(lines.some((l) => l.includes("Draw:") && l.includes("main attacker"))).toBe(true);
      expect(lines.some((l) => l.includes("defender) drew"))).toBe(true);
      expect(lines.some((l) => l.includes("Next lead"))).toBe(true);
    });

    it("logs pass_attack after a beaten attack", () => {
      let s = createInitialGameState(11);
      const firstAttack = getLegalMoves(s).find((m) => m.type === "attack")!;
      s = applyMove(s, firstAttack);
      const defendMove = getLegalMoves(s).find((m) => m.type === "defend");
      expect(defendMove).toBeDefined();
      s = applyMove(s, defendMove!);
      expect(s.phase).toBe("attacker_lead");
      const pass = getLegalMoves(s).find((m) => m.type === "pass_attack");
      expect(pass).toBeDefined();
      const next = applyMove(s, pass!);
      const lines = buildLogEvents(s, pass!, next);
      expect(lines.some((l) => l.includes("passed attack"))).toBe(true);
      expect(lines.some((l) => l.includes("draw phase"))).toBe(true);
    });
  });
});
