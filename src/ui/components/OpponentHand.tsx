import type { PlayerState } from "@engine/gameState";
import { HandRow } from "./HandRow";

export interface OpponentHandProps {
  player: PlayerState;
  label: string;
  faceDown?: boolean;
}

/** Face-down / count-only hand for the opponent. */
export function OpponentHand({ player, label, faceDown = true }: OpponentHandProps) {
  return (
    <section className="opponent-hand" aria-label={label}>
      <h2 className="opponent-hand__title">
        {label}
        <span className="opponent-hand__score">Score: {player.score}</span>
      </h2>
      <HandRow cards={player.hand} faceDown={faceDown} />
      <p className="opponent-hand__count">{player.hand.length} cards</p>
    </section>
  );
}
