import type { PlayerState } from "@engine/gameState";
import { HandRow } from "./HandRow";

export interface PlayerHandProps {
  player: PlayerState;
  label: string;
  /** Highlight as the local player. */
  isLocal: boolean;
  /** Emphasize when this player must choose a move. */
  isActing?: boolean;
}

export function PlayerHand({ player, label, isLocal, isActing }: PlayerHandProps) {
  return (
    <section
      className={`player-hand ${isLocal ? "player-hand--local" : ""} ${
        isActing ? "player-hand--acting" : ""
      }`}
      aria-label={label}
    >
      <h2 className="player-hand__title">
        {label}
        <span className="player-hand__score">Score: {player.score}</span>
      </h2>
      <HandRow cards={player.hand} />
    </section>
  );
}
