import { useState } from "react";
import { useGameSession } from "../state/useGameSession";
import type { BotBrain } from "../ai/botBrain";
import { BOT_BRAIN_LABELS, BOT_BRAIN_OPTIONS } from "../ai/botBrain";
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
  const [botBrain, setBotBrain] = useState<BotBrain | null>(null);
  const { seed, setSeed, state, gameLog, dispatchMove, resetDeal, moveError } =
    useGameSession(DEFAULT_SEED, botBrain);

  const localPlayer: PlayerId = 0;
  const p1: PlayerId = 1;
  const acting = getActingPlayerId(state);
  const winner = getWinner(state);
  const gameEnded = winner !== null;

  const p0Acting =
    !gameEnded && acting !== "draw" && acting !== null && acting === localPlayer;
  const p1Acting =
    !gameEnded && acting !== "draw" && acting !== null && acting === p1;

  const p1Label = botBrain
    ? `Player 1 (${BOT_BRAIN_LABELS[botBrain]})`
    : "Player 1 (hot-seat)";

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
            checked={botBrain !== null}
            onChange={(e) => setBotBrain(e.target.checked ? "greedy" : null)}
          />{" "}
          Play vs bot
        </label>

        {botBrain !== null && (
          <label className="app__brain-select">
            Brain:{" "}
            <select
              value={botBrain}
              onChange={(e) => setBotBrain(e.target.value as BotBrain)}
            >
              {BOT_BRAIN_OPTIONS.map((b) => (
                <option key={b} value={b}>
                  {BOT_BRAIN_LABELS[b]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="app-layout">
        <div className="app-layout__main">
          <GameOverBanner state={state} onNewDeal={resetDeal} />

          <TurnIndicator state={state} localPlayer={localPlayer} />

          <PlayerHand
            player={state.players[p1]}
            label={p1Label}
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
            {botBrain
              ? `You are Player 0 (bottom). Player 1 is the ${BOT_BRAIN_LABELS[botBrain]} and moves automatically after your turns.`
              : "Two-player hot-seat: take turns using the move buttons. Player 0 is you at the bottom; Player 1 sits at the top."}
          </p>
        </div>

        <GameAuditPanel lines={gameLog} />
      </div>
    </div>
  );
}
