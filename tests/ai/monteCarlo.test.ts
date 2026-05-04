import { describe, it, expect } from "vitest";
import {
  createInitialGameState,
  createRng,
  getLegalMoves,
  applyMove,
} from "../../src/engine";
import {
  chooseMonteCarloMove,
  resolveMoveForDeterminized,
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
});
