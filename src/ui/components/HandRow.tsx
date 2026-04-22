import type { Card } from "@engine/types";
import { CardBack } from "./CardBack";
import { CardFace } from "./CardFace";

export interface HandRowProps {
  cards: Card[];
  faceDown?: boolean;
  size?: "sm" | "md";
}

export function HandRow({ cards, faceDown = false, size = "md" }: HandRowProps) {
  return (
    <div className="hand-row">
      {cards.map((card, i) =>
        faceDown ? (
          <CardBack key={`back-${i}`} size={size} />
        ) : (
          <CardFace key={`face-${card.suit}-${card.rank}-${i}`} card={card} size={size} />
        )
      )}
    </div>
  );
}
