import type { PlayerState } from "@engine/gameState";

export interface OpponentHandProps {
  player: PlayerState;
  label: string;
}

/** Face-down / count-only hand for the opponent. */
export function OpponentHand({ player, label }: OpponentHandProps) {
  return (
    <section className="opponent-hand" aria-label={label}>
      <h2 className="opponent-hand__title">
        {label}
        <span className="opponent-hand__score">Score: {player.score}</span>
      </h2>
      <div className="opponent-hand__cards">
        {player.hand.map((_, i) => (
          <span key={i} className="card card--back" aria-hidden title="Hidden card">
            ?
          </span>
        ))}
      </div>
      <p className="opponent-hand__count">{player.hand.length} cards</p>
    </section>
  );
}
