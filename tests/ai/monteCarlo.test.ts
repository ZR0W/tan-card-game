import { describe, it, expect, vi } from "vitest";
import {
  createInitialGameState,
  createRng,
  getLegalMoves,
  applyMove,
} from "../../src/engine";
import {
  chooseMonteCarloMove,
  moveSortKey,
  resolveMoveForDeterminized,
  type MonteCarloDecisionRecord,
} from "../../src/ai/monteCarlo";
import { generateDeterminizedState } from "../../src/ai/determinization";

describe("resolveMoveForDeterminized", () => {
  it("maps attack by card identity when index shifts", () => {
    const state = createInitialGameState(1);
    const det = generateDeterminizedState(state, 0, createRng(42));
    const moves = getLegalMoves(state);
    const attack = moves.find((m) => m.type === "attack")!;
    const resolved = resolveMoveForDeterminized(attack, state, det);
    expect(resolved).not.toBeNull();
    expect(resolved!.type).toBe("attack");
    const card = state.players[state.currentAttacker].hand[attack.cardIndex];
    const detCard =
      det.players[det.currentAttacker].hand[(resolved as { cardIndex: number }).cardIndex];
    expect(detCard).toEqual(card);
  });
});

describe("chooseMonteCarloMove", () => {
  const tiny = { K: 1, N: 1 };

  it("returns a legal move on opening position", () => {
    const state = createInitialGameState(123);
    const move = chooseMonteCarloMove(state, 0, tiny, 1);
    expect(move).not.toBeNull();
    const legal = getLegalMoves(state);
    expect(legal.some((m) => JSON.stringify(m) === JSON.stringify(move))).toBe(true);
  });

  it("is deterministic for fixed workSalt and tiny config", () => {
    const state = createInitialGameState(55);
    const a = chooseMonteCarloMove(state, 0, tiny, 7);
    const b = chooseMonteCarloMove(state, 0, tiny, 7);
    expect(a).toEqual(b);
  });

  it("returns draw when only draw is legal", () => {
    let state = createInitialGameState(9);
    const attack = getLegalMoves(state).find((m) => m.type === "attack")!;
    state = applyMove(state, attack);
    state = applyMove(state, { type: "give_up" });
    expect(state.phase).toBe("draw");
    const move = chooseMonteCarloMove(state, 0, tiny, 2);
    expect(move).toEqual({ type: "draw" });
  });

  it("invokes onDecision once with stats matching rollout invariant", () => {
    const onDecision = vi.fn();
    const state = createInitialGameState(123);
    const config = { K: 2, N: 4 };
    const workSalt = 99;
    const sortedLegal = [...getLegalMoves(state)].sort((a, b) =>
      moveSortKey(a).localeCompare(moveSortKey(b))
    );
    const move = chooseMonteCarloMove(state, 0, config, workSalt, { onDecision });
    expect(onDecision).toHaveBeenCalledTimes(1);
    const r = onDecision.mock.calls[0]![0]! as MonteCarloDecisionRecord;
    expect(r.chosen).toEqual(move);
    expect(r.chosenMean).toBeGreaterThanOrEqual(0);
    expect(r.viewer).toBe(0);
    expect(r.workSalt).toBe(workSalt);
    expect(r.config).toEqual(config);
    expect(r.phase).toBe(state.phase);
    expect(r.currentAttacker).toBe(state.currentAttacker);
    expect(r.currentDefender).toBe(state.currentDefender);
    expect(r.candidates).toHaveLength(sortedLegal.length);
    expect(r.candidates.map((c) => c.moveKey)).toEqual(sortedLegal.map(moveSortKey));
    for (const c of r.candidates) {
      expect(c.rolloutsDone).toBe((config.K - c.skippedDeterminizations) * config.N);
      const expectedMean = c.rolloutsDone > 0 ? c.wins / c.rolloutsDone : 0;
      expect(c.mean).toBeCloseTo(expectedMean, 10);
    }
  });

  it("accepts empty options without throwing", () => {
    const state = createInitialGameState(77);
    expect(() => chooseMonteCarloMove(state, 0, tiny, 5, {})).not.toThrow();
    expect(chooseMonteCarloMove(state, 0, tiny, 6, { onDecision: undefined })).not.toBeNull();
  });
});
