import type { GameState } from "../engine/gameState";
import type { Move } from "../engine/rules";
import type { Card } from "../engine/types";

export function formatCard(card: Card): string {
  return `${card.rank} ${card.suit}`;
}

export function describeMove(move: Move, state: GameState): string {
  switch (move.type) {
    case "attack": {
      const c = state.players[state.currentAttacker].hand[move.cardIndex];
      return c ? `attack ${formatCard(c)}` : `attack #${move.cardIndex}`;
    }
    case "defend": {
      const c = state.players[state.currentDefender].hand[move.cardIndex];
      return c ? `defend ${formatCard(c)}` : `defend #${move.cardIndex}`;
    }
    case "give_up":
      return "give_up";
    case "pass_attack":
      return "pass_attack";
    case "draw":
      return "draw";
    default: {
      const _exhaustive: never = move;
      return String(_exhaustive);
    }
  }
}

export function formatGameState(state: GameState): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push(`Trump: ${state.trumpSuit}   Turn-up: ${formatCard(state.turnUpCard)}`);
  lines.push(
    `Phase: ${state.phase}   Attacker: P${state.currentAttacker}   Defender: P${state.currentDefender}`
  );
  lines.push(`Deck: ${state.deck.length} cards   Discard: ${state.discardPile.length} cards`);
  lines.push(`P0 score: ${state.players[0].score}   P1 score: ${state.players[1].score}`);
  lines.push(`P0 hand (${state.players[0].hand.length}): ${state.players[0].hand.map(formatCard).join(", ")}`);
  lines.push(`P1 hand (${state.players[1].hand.length}): ${state.players[1].hand.map(formatCard).join(", ")}`);
  const { attacks, defences } = state.currentRound;
  lines.push(
    `Round — attacks: [${attacks.map(formatCard).join(", ")}]   defences: [${defences.map(formatCard).join(", ")}]`
  );
  return lines.join("\n");
}
