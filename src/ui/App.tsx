import { useMemo, useState } from "react";
import { createInitialGameState } from "@engine/index";
import type { PlayerId } from "@engine/gameState";
import { GameBoard } from "./components/GameBoard";
import { OpponentHand } from "./components/OpponentHand";
import { PlayerHand } from "./components/PlayerHand";
import { TurnIndicator } from "./components/TurnIndicator";

const DEFAULT_SEED = 12345;

export function App() {
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const gameState = useMemo(() => createInitialGameState(seed), [seed]);

  /** Story 2.1: fixed perspective — P0 is "you", P1 is opponent. */
  const localPlayer: PlayerId = 0;
  const opponentId: PlayerId = 1;

  return (
    <div className="app">
      <h1 className="app__title">Tan</h1>
      <div className="app__dev">
        <label htmlFor="seed-input">Deal seed (dev)</label>
        <input
          id="seed-input"
          type="number"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value) || 0)}
        />
      </div>

      <TurnIndicator state={gameState} localPlayer={localPlayer} />

      <OpponentHand
        player={gameState.players[opponentId]}
        label={`Player ${opponentId} (opponent)`}
      />

      <GameBoard state={gameState} />

      <PlayerHand
        player={gameState.players[localPlayer]}
        label={`Player ${localPlayer} (you)`}
        isLocal
      />

      <p className="app__hint">
        Story 2.1: display only. Moves will arrive in Story 2.2.
      </p>
    </div>
  );
}
