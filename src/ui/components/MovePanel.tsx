import type { GameState } from "@engine/gameState";
import { getLegalMoves, getWinner } from "@engine/index";
import type { Move } from "@engine/rules";
import { describeMove } from "../moveLabels";

export interface MovePanelProps {
  state: GameState;
  onMove: (move: Move) => void;
  disabled?: boolean;
  error: string | null;
}

export function MovePanel({ state, onMove, disabled, error }: MovePanelProps) {
  const winner = getWinner(state);
  const legal = getLegalMoves(state);
  const noMoves = winner !== null || legal.length === 0;

  return (
    <section className="move-panel" aria-label="Legal moves">
      <h2 className="move-panel__title">Moves</h2>
      {error && (
        <p className="move-panel__error" role="alert">
          {error}
        </p>
      )}
      <div className="move-panel__buttons">
        {legal.map((move, i) => (
          <button
            key={`${i}-${move.type}`}
            type="button"
            className="move-panel__btn"
            disabled={disabled || noMoves}
            onClick={() => onMove(move)}
          >
            {describeMove(move, state)}
          </button>
        ))}
      </div>
      {noMoves && winner === null && state.phase !== "game_over" && (
        <p className="move-panel__empty">No moves available.</p>
      )}
    </section>
  );
}
