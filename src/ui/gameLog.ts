import type { Card } from "@engine/types";
import type { GameState, PlayerId } from "@engine/gameState";
import type { Move } from "@engine/rules";
import { formatCard } from "./cardFormat";

function cardKey(c: Card): string {
  return `${c.suit}:${c.rank}`;
}

/** Cards newly present in `nextHand` vs `prevHand` (multiset difference). Order follows `nextHand`. */
export function cardsAcquired(prevHand: Card[], nextHand: Card[]): Card[] {
  const counts = new Map<string, number>();
  for (const c of prevHand) {
    const k = cardKey(c);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const acquired: Card[] = [];
  for (const c of nextHand) {
    const k = cardKey(c);
    const n = counts.get(k) ?? 0;
    if (n > 0) counts.set(k, n - 1);
    else acquired.push(c);
  }
  return acquired;
}

function formatCardList(cards: Card[]): string {
  if (cards.length === 0) return "(none)";
  return cards.map(formatCard).join(", ");
}

/** Lines appended when starting or resetting a deal (same seed). */
export function initialDealLines(seed: number, state: GameState): string[] {
  const trumpLine = `Trump: ${state.trumpSuit} (turn-up ${formatCard(state.turnUpCard)}).`;
  const p0 = state.players[0].hand.map(formatCard).join(", ");
  const p1 = state.players[1].hand.map(formatCard).join(", ");
  return [
    `Game start — deal seed ${seed}.`,
    trumpLine,
    `Player 0 initial hand (${state.players[0].hand.length} cards): ${p0}.`,
    `Player 1 initial hand (${state.players[1].hand.length} cards): ${p1}.`,
  ];
}

/**
 * Human-readable lines for one rules transition (`prev` --move--> `next`).
 */
export function buildLogEvents(
  prev: GameState,
  move: Move,
  next: GameState
): string[] {
  const lines: string[] = [];

  switch (move.type) {
    case "attack": {
      const att = prev.currentAttacker;
      const def = prev.currentDefender;
      const card = prev.players[att].hand[move.cardIndex];
      if (prev.currentRound.attacks.length === 0) {
        lines.push(`Round started — attacker P${att}, defender P${def}.`);
      }
      if (card) {
        lines.push(`Player ${att} attacked with ${formatCard(card)}.`);
      } else {
        lines.push(`Player ${att} attacked (card index ${move.cardIndex}).`);
      }
      lines.push(`Turn: defender P${def} must respond.`);
      break;
    }
    case "defend": {
      const def = prev.currentDefender;
      const att = prev.currentAttacker;
      const card = prev.players[def].hand[move.cardIndex];
      if (card) {
        lines.push(`Player ${def} defended with ${formatCard(card)}.`);
      } else {
        lines.push(`Player ${def} defended (card index ${move.cardIndex}).`);
      }
      if (
        next.phase === "attacker_lead" &&
        next.currentRound.attacks.length > 0
      ) {
        lines.push(
          `Attack beaten — attacker P${att} may follow up or pass attack.`
        );
      }
      break;
    }
    case "give_up": {
      const def = prev.currentDefender;
      const pile = [
        ...prev.currentRound.attacks,
        ...prev.currentRound.defences,
      ];
      lines.push(
        `Player ${def} gave up and took ${pile.length} card(s): ${formatCardList(pile)}.`
      );
      lines.push("End of round — draw phase to refill hands.");
      break;
    }
    case "pass_attack": {
      const cr = prev.currentRound;
      const n = cr.attacks.length + cr.defences.length;
      lines.push(
        `Player ${prev.currentAttacker} passed attack — ${n} round card(s) go to discard. Attacker and defender roles swap.`
      );
      lines.push("End of round — draw phase to refill hands.");
      break;
    }
    case "draw": {
      const att = prev.currentAttacker;
      const def: PlayerId = att === 0 ? 1 : 0;
      const aAdded = cardsAcquired(prev.players[att].hand, next.players[att].hand);
      const dAdded = cardsAcquired(prev.players[def].hand, next.players[def].hand);
      lines.push(
        `Draw: Player ${att} (main attacker) drew ${formatCardList(aAdded)}.`
      );
      lines.push(
        `Draw: Player ${def} (defender) drew ${formatCardList(dAdded)}.`
      );
      if (next.phase === "game_over" && next.winner !== undefined) {
        lines.push(`Game over — winner Player ${next.winner}.`);
      } else {
        lines.push(
          `Next lead: attacker P${next.currentAttacker}, defender P${next.currentDefender}.`
        );
      }
      break;
    }
  }

  return lines;
}
