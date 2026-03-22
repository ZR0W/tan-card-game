import { useCallback, useState } from "react";
import {
  applyMove,
  createInitialGameState,
  IllegalMoveError,
} from "@engine/index";
import type { Move } from "@engine/rules";
import type { GameState } from "@engine/gameState";

export function useGameSession(initialSeed: number) {
  const [seed, setSeedState] = useState(initialSeed);
  const [state, setState] = useState<GameState>(() =>
    createInitialGameState(initialSeed)
  );
  const [moveError, setMoveError] = useState<string | null>(null);

  const setSeed = useCallback((next: number) => {
    setSeedState(next);
    setState(createInitialGameState(next));
    setMoveError(null);
  }, []);

  const resetDeal = useCallback(() => {
    setState(createInitialGameState(seed));
    setMoveError(null);
  }, [seed]);

  const dispatchMove = useCallback((move: Move) => {
    try {
      setMoveError(null);
      setState((prev) => applyMove(prev, move));
    } catch (e) {
      if (e instanceof IllegalMoveError) {
        setMoveError(e.message);
        return;
      }
      throw e;
    }
  }, []);

  return {
    seed,
    setSeed,
    state,
    dispatchMove,
    resetDeal,
    moveError,
    clearMoveError: () => setMoveError(null),
  };
}
