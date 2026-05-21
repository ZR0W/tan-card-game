import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  createInitialGameState,
  IllegalMoveError,
} from "@engine/index";
import type { Move } from "@engine/rules";
import type { GameState } from "@engine/gameState";
import { advanceSession } from "./advanceSession";
import { isMcDebugEnabled } from "./mcDebug";
import { initialDealLines } from "../ui/gameLog";

type SessionModel = {
  game: GameState;
  log: string[];
};

type SessionAction =
  | { type: "reset"; seed: number }
  | { type: "moveOk"; game: GameState; appended: string[] };

function sessionReducer(
  state: SessionModel,
  action: SessionAction
): SessionModel {
  switch (action.type) {
    case "reset": {
      const game = createInitialGameState(action.seed);
      return { game, log: initialDealLines(action.seed, game) };
    }
    case "moveOk":
      return {
        game: action.game,
        log: [...state.log, ...action.appended],
      };
    default:
      return state;
  }
}

function initSession(seed: number): SessionModel {
  const game = createInitialGameState(seed);
  return { game, log: initialDealLines(seed, game) };
}

export function useGameSession(initialSeed: number, vsBot = false) {
  const [seed, setSeedState] = useState(initialSeed);
  const [session, dispatch] = useReducer(sessionReducer, initialSeed, initSession);
  const [moveError, setMoveError] = useState<string | null>(null);
  const mcWorkSalt = useRef(0);

  const prevVsBot = useRef(vsBot);
  useEffect(() => {
    if (prevVsBot.current === vsBot) return;
    prevVsBot.current = vsBot;
    mcWorkSalt.current = 0;
    dispatch({ type: "reset", seed });
    setMoveError(null);
  }, [vsBot, seed]);

  const setSeed = useCallback((next: number) => {
    setSeedState(next);
    mcWorkSalt.current = 0;
    dispatch({ type: "reset", seed: next });
    setMoveError(null);
  }, []);

  const resetDeal = useCallback(() => {
    mcWorkSalt.current = 0;
    dispatch({ type: "reset", seed });
    setMoveError(null);
  }, [seed]);

  const dispatchMove = useCallback(
    (move: Move) => {
      try {
        setMoveError(null);
        const mcDebug = vsBot && isMcDebugEnabled();
        const { next, events } = advanceSession(session.game, move, vsBot, {
          nextMcWorkSalt: () => {
            mcWorkSalt.current += 1;
            return mcWorkSalt.current;
          },
          monteCarloOptions: mcDebug
            ? {
                onDecision: (r) => {
                  console.debug("[MC]", JSON.stringify(r));
                },
              }
            : undefined,
        });
        dispatch({ type: "moveOk", game: next, appended: events });
      } catch (e) {
        if (e instanceof IllegalMoveError) {
          setMoveError(e.message);
          return;
        }
        throw e;
      }
    },
    [session.game, vsBot]
  );

  return {
    seed,
    setSeed,
    state: session.game,
    gameLog: session.log,
    dispatchMove,
    resetDeal,
    moveError,
    clearMoveError: () => setMoveError(null),
  };
}
