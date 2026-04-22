import type { GameState } from "@engine/gameState";
import { formatCard } from "../cardFormat";
import { CardFace } from "./CardFace";

export interface GameBoardProps {
  state: GameState;
}

export function GameBoard({ state }: GameBoardProps) {
  const { attacks, defences } = state.currentRound;

  return (
    <section className="game-board" aria-label="Table">
      <div className="game-board__meta">
        <span>Trump: {state.trumpSuit}</span>
        <span>Turn-up: {formatCard(state.turnUpCard)}</span>
        <span>Deck: {state.deck.length}</span>
        <span>Discard: {state.discardPile.length}</span>
      </div>
      <div className="game-board__round" aria-label="Current round">
        <div className="game-board__row game-board__row--attacks">
          <span className="game-board__label">Attacks</span>
          <div className="game-board__cards">
            {attacks.length === 0 ? (
              <span className="game-board__empty">No attacks yet</span>
            ) : (
              attacks.map((c, i) => (
                <CardFace key={`a-${i}`} card={c} size="sm" />
              ))
            )}
          </div>
        </div>
        <div className="game-board__row game-board__row--defences">
          <span className="game-board__label">Defences</span>
          <div className="game-board__cards">
            {defences.length === 0 ? (
              <span className="game-board__empty">No defences yet</span>
            ) : (
              defences.map((c, i) => (
                <CardFace key={`d-${i}`} card={c} size="sm" />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
