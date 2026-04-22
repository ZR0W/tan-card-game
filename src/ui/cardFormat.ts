import type { Card } from "@engine/types";
import { cardLabel } from "./cardVisuals";

/** Display label for a card (UI layer; mirrors CLI formatting). */
export function formatCard(card: Card): string {
  return cardLabel(card).replace(" of ", " ");
}
