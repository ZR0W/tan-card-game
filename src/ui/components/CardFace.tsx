import type { Card } from "@engine/types";
import {
  cardLabel,
  rankShort,
  suitIcon,
  suitSymbol,
  suitToneClass,
} from "../cardVisuals";

export interface CardFaceProps {
  card: Card;
  size?: "sm" | "md";
}

export function CardFace({ card, size = "md" }: CardFaceProps) {
  const tone = suitToneClass(card.suit);

  return (
    <article
      className={`playing-card playing-card--face playing-card--${size} ${tone}`}
      role="img"
      aria-label={cardLabel(card)}
      title={cardLabel(card)}
    >
      <div className="playing-card__corner">
        <span className="playing-card__rank">{rankShort(card.rank)}</span>
        <img
          src={suitIcon(card.suit)}
          className="playing-card__corner-icon"
          alt=""
          aria-hidden
        />
      </div>
      <div className="playing-card__center">
        <img
          src={suitIcon(card.suit)}
          className="playing-card__center-icon"
          alt=""
          aria-hidden
        />
        <span className="sr-only">{suitSymbol(card.suit)}</span>
      </div>
      <div className="playing-card__corner playing-card__corner--bottom">
        <span className="playing-card__rank">{rankShort(card.rank)}</span>
        <img
          src={suitIcon(card.suit)}
          className="playing-card__corner-icon"
          alt=""
          aria-hidden
        />
      </div>
    </article>
  );
}
