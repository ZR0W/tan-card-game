import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  createInitialGameState,
  IllegalMoveError,
} from "@engine/index";
import type { Move } from "@engine/rules";
import type { GameState } from "@engine/gameState";
import type { BotBrain } from "../ai/botBrain";
import { advanceSession } from "./advanceSession";
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

/**
 * @param botBrain — `null` for human vs human; a `BotBrain` string to enable
 *   the AI for Player 1.  Changing this value resets the deal.
 */
export function useGameSession(initialSeed: number, botBrain: BotBrain | null = null) {
  const [seed, setSeedState] = useState(initialSeed);
  const [session, dispatch] = useReducer(sessionReducer, initialSeed, initSession);
  const [moveError, setMoveError] = useState<string | null>(null);

  const prevBotBrain = useRef(botBrain);
  useEffect(() => {
    if (prevBotBrain.current === botBrain) return;
    prevBotBrain.current = botBrain;
    dispatch({ type: "reset", seed });
    setMoveError(null);
  }, [botBrain, seed]);

  const setSeed = useCallback((next: number) => {
    setSeedState(next);
    dispatch({ type: "reset", seed: next });
    setMoveError(null);
  }, []);

  const resetDeal = useCallback(() => {
    dispatch({ type: "reset", seed });
    setMoveError(null);
  }, [seed]);

  const dispatchMove = useCallback(
    (move: Move) => {
      try {
        setMoveError(null);
        const { next, events } = advanceSession(session.game, move, botBrain);
        dispatch({ type: "moveOk", game: next, appended: events });
      } catch (e) {
        if (e instanceof IllegalMoveError) {
          setMoveError(e.message);
          return;
        }
        throw e;
      }
    },
    [session.game, botBrain]
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
