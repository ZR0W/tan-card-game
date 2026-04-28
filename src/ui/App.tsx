import { useState } from "react";
import { useGameSession } from "../state/useGameSession";
import type { PlayerId } from "@engine/gameState";
import { getWinner } from "@engine/index";
import { GameAuditPanel } from "./components/GameAuditPanel";
import { GameBoard } from "./components/GameBoard";
import { GameOverBanner } from "./components/GameOverBanner";
import { MovePanel } from "./components/MovePanel";
import { PlayerHand } from "./components/PlayerHand";
import { getActingPlayerId, TurnIndicator } from "./components/TurnIndicator";

const DEFAULT_SEED = 12345;

export function App() {
  const [vsBot, setVsBot] = useState(false);
  const { seed, setSeed, state, gameLog, dispatchMove, resetDeal, moveError } =
    useGameSession(DEFAULT_SEED, vsBot);

  const localPlayer: PlayerId = 0;
  const p1: PlayerId = 1;
  const acting = getActingPlayerId(state);
  const winner = getWinner(state);
  const gameEnded = winner !== null;

  const p0Acting =
    !gameEnded && acting !== "draw" && acting !== null && acting === localPlayer;
  const p1Acting =
    !gameEnded && acting !== "draw" && acting !== null && acting === p1;

  return (
    <div className="app">
      <h1 className="app__title">Tan</h1>

      <div className="app__dev">
        <label htmlFor="seed-input">Deal seed</label>
        <input
          id="seed-input"
          type="number"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value) || 0)}
        />
        <span className="app__dev-hint">Changing seed starts a new deal.</span>
        <label className="app__vs-bot">
          <input
            type="checkbox"
            checked={vsBot}
            onChange={(e) => setVsBot(e.target.checked)}
          />{" "}
          Play vs bot (Player 1 uses heuristic AI)
        </label>
      </div>

      <div className="app-layout">
        <div className="app-layout__main">
          <GameOverBanner state={state} onNewDeal={resetDeal} />

          <TurnIndicator state={state} localPlayer={localPlayer} />

          <PlayerHand
            player={state.players[p1]}
            label={vsBot ? "Player 1 (heuristic bot)" : "Player 1 (hot-seat)"}
            isLocal={false}
            isActing={p1Acting}
          />

          <GameBoard state={state} />

          <MovePanel
            state={state}
            onMove={dispatchMove}
            disabled={gameEnded}
            error={moveError}
          />

          <PlayerHand
            player={state.players[localPlayer]}
            label="Player 0 (you)"
            isLocal
            isActing={p0Acting}
          />

          <p className="app__hint">
            {vsBot
              ? "You are Player 0 (bottom). Player 1 is the heuristic bot and moves automatically after your turns."
              : 'Two-player hot-seat: take turns using the move buttons. Player 0 is you at the bottom; Player 1 sits at the top.'}
          </p>
        </div>

        <GameAuditPanel lines={gameLog} />
      </div>
    </div>
  );
}
