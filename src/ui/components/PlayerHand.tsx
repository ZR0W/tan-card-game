import type { PlayerState } from "@engine/gameState";
import { formatCard } from "../cardFormat";

export interface PlayerHandProps {
  player: PlayerState;
  label: string;
  /** Highlight as the local player. */
  isLocal: boolean;
}

export function PlayerHand({ player, label, isLocal }: PlayerHandProps) {
  return (
    <section
      className={`player-hand ${isLocal ? "player-hand--local" : ""}`}
      aria-label={label}
    >
      <h2 className="player-hand__title">
        {label}
        <span className="player-hand__score">Score: {player.score}</span>
      </h2>
      <div className="player-hand__cards">
        {player.hand.map((c, i) => (
          <span key={`${player.id}-${i}`} className="card card--face-up">
            {formatCard(c)}
          </span>
        ))}
      </div>
    </section>
  );
}
