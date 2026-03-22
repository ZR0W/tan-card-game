import type { GameState } from "@engine/gameState";
import { getWinner } from "@engine/index";

export interface GameOverBannerProps {
  state: GameState;
  onNewDeal: () => void;
}

export function GameOverBanner({ state, onNewDeal }: GameOverBannerProps) {
  const winner = getWinner(state);
  if (winner === null) return null;

  return (
    <div className="game-over" role="status">
      <p className="game-over__text">
        Game over — <strong>Winner: Player {winner}</strong>
      </p>
      <button type="button" className="game-over__btn" onClick={onNewDeal}>
        New deal (same seed)
      </button>
    </div>
  );
}
