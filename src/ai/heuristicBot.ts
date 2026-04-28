import type { GameState, PlayerId } from "@engine/gameState";
import {
  applyMove,
  getLegalMoves,
  getWinner,
} from "@engine/rules";
import type { Move } from "@engine/rules";
import { cloneGameState } from "@engine/simulator";
import { evaluateState } from "./evaluation";

function moveSortKey(m: Move): string {
  switch (m.type) {
    case "attack":
      return `attack:${m.cardIndex}`;
    case "defend":
      return `defend:${m.cardIndex}`;
    case "draw":
      return "draw";
    case "give_up":
      return "give_up";
    case "pass_attack":
      return "pass_attack";
    default: {
      const _x: never = m;
      return String(_x);
    }
  }
}

function compareMoves(a: Move, b: Move): number {
  return moveSortKey(a).localeCompare(moveSortKey(b));
}

/**
 * One-step lookahead: pick the legal move whose resulting state maximizes
 * `evaluateState` for `botPlayer`. Tie-break: lexicographic move key.
 */
export function chooseGreedyMove(
  state: GameState,
  botPlayer: PlayerId
): Move | null {
  if (getWinner(state) !== null) return null;
  const moves = getLegalMoves(state);
  if (moves.length === 0) return null;
  const ordered = [...moves].sort(compareMoves);
  let best: Move = ordered[0]!;
  let bestScore = -Infinity;
  for (const move of ordered) {
    const next = applyMove(cloneGameState(state), move);
    const score = evaluateState(next, botPlayer);
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}
