import type { GameState } from "@engine/gameState";
import type { Move } from "@engine/rules";
import { formatCard } from "./cardFormat";

/** Human-readable move label (same idea as CLI `describeMove`). */
export function describeMove(move: Move, state: GameState): string {
  switch (move.type) {
    case "attack": {
      const c = state.players[state.currentAttacker].hand[move.cardIndex];
      return c ? `Attack ${formatCard(c)}` : `Attack #${move.cardIndex}`;
    }
    case "defend": {
      const c = state.players[state.currentDefender].hand[move.cardIndex];
      return c ? `Defend ${formatCard(c)}` : `Defend #${move.cardIndex}`;
    }
    case "give_up":
      return "Give up (take cards)";
    case "pass_attack":
      return "Pass attack (discard round)";
    case "draw":
      return "Draw cards";
    default: {
      const _exhaustive: never = move;
      return String(_exhaustive);
    }
  }
}
