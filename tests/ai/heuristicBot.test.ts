import { describe, it, expect } from "vitest";
import {
  createInitialGameState,
  getLegalMoves,
  applyMove,
  getWinner,
} from "../../src/engine";
import type { Move } from "../../src/engine/rules";
import { chooseGreedyMove } from "../../src/ai/heuristicBot";

describe("chooseGreedyMove", () => {
  it("returns a legal move on a typical opening state", () => {
    const state = createInitialGameState(123);
    const move = chooseGreedyMove(state, 0);
    expect(move).not.toBeNull();
    const legal = getLegalMoves(state);
    expect(legal.some((m) => movesEqual(m, move!))).toBe(true);
  });

  it("when only draw is legal, picks draw", () => {
    let state = createInitialGameState(5);
    const attack = getLegalMoves(state).find((m) => m.type === "attack")!;
    state = applyMove(state, attack);
    state = applyMove(state, { type: "give_up" });
    expect(state.phase).toBe("draw");
    const move = chooseGreedyMove(state, 0);
    expect(move).toEqual({ type: "draw" });
  });

  it("human-vs-bot style turns reach game over without throwing", () => {
    let state = createInitialGameState(777);
    let depth = 0;
    const maxDepth = 400;
    while (getWinner(state) === null && depth < maxDepth) {
      const botTurn =
        state.phase === "draw" ||
        (state.phase === "attacker_lead" && state.currentAttacker === 1) ||
        (state.phase === "defender_respond" && state.currentDefender === 1);
      const mover = botTurn ? 1 : 0;
      const move = chooseGreedyMove(state, mover);
      expect(move).not.toBeNull();
      state = applyMove(state, move!);
      depth++;
    }
    expect(depth).toBeLessThan(maxDepth);
    expect(getWinner(state)).not.toBeNull();
  });
});

function movesEqual(a: Move, b: Move): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "attack" && b.type === "attack")
    return a.cardIndex === b.cardIndex;
  if (a.type === "defend" && b.type === "defend")
    return a.cardIndex === b.cardIndex;
  return true;
}
