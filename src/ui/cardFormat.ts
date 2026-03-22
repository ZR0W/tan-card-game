import type { Card } from "@engine/types";

/** Display label for a card (UI layer; mirrors CLI formatting). */
export function formatCard(card: Card): string {
  return `${card.rank} ${card.suit}`;
}
