import cardBack from "../assets/cards/card-back.svg";

export interface CardBackProps {
  size?: "sm" | "md";
}

export function CardBack({ size = "md" }: CardBackProps) {
  return (
    <article
      className={`playing-card playing-card--back playing-card--${size}`}
      role="img"
      aria-label="Face-down card"
      title="Face-down card"
    >
      <img src={cardBack} alt="" aria-hidden className="playing-card__back-image" />
    </article>
  );
}
