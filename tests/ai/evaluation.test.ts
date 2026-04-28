import { describe, it, expect } from "vitest";
import {
  createInitialGameState,
  applyMove,
  getWinner,
} from "../../src/engine";
import type { GameState } from "../../src/engine/gameState";
import type { PlayerId } from "../../src/engine/gameState";
import { combineMetrics, evaluateState } from "../../src/ai/evaluation";
import { evaluateMetrics } from "../../src/ai/metrics";

describe("evaluation", () => {
  it("evaluateState is pure for the same inputs", () => {
    const state = createInitialGameState(42);
    const a = evaluateState(state, 0);
    const b = evaluateState(state, 0);
    expect(a).toBe(b);
  });

  it("terminal win for player scores higher than heuristic mid-game", () => {
    const mid = createInitialGameState(7);
    expect(getWinner(mid)).toBe(null);
    const terminal: GameState = {
      ...mid,
      phase: "game_over",
      winner: 0,
    };
    expect(evaluateState(terminal, 0)).toBeGreaterThan(evaluateState(mid, 0));
    expect(evaluateState(terminal, 1)).toBeLessThan(evaluateState(mid, 1));
  });

  it("swap player perspective flips terminal signs", () => {
    const mid = createInitialGameState(7);
    const terminal: GameState = {
      ...mid,
      phase: "game_over",
      winner: 1 as PlayerId,
    };
    expect(evaluateState(terminal, 1)).toBeGreaterThan(0);
    expect(evaluateState(terminal, 0)).toBeLessThan(0);
  });

  it("combineMetrics applies weights", () => {
    const m = evaluateMetrics(createInitialGameState(1), 0);
    const sum = combineMetrics(m);
    expect(Number.isFinite(sum)).toBe(true);
  });

  it("fewer cards in own hand improves handEconomy metric", () => {
    const full = createInitialGameState(99);
    const mFull = evaluateMetrics(full, 0).handEconomy;
    const fewer: GameState = {
      ...full,
      players: [
        { ...full.players[0], hand: full.players[0].hand.slice(1) },
        full.players[1],
      ],
    };
    const mFewer = evaluateMetrics(fewer, 0).handEconomy;
    expect(mFewer).toBeGreaterThan(mFull);
  });
});
