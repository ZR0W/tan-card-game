import type { GameState, PlayerId } from "@engine/gameState";

export interface TurnIndicatorProps {
  state: GameState;
  /** Local human is treated as "You" (bottom hand). */
  localPlayer: PlayerId;
}

/** Who must act next, derived from phase + attacker/defender. */
export function getActingPlayerId(state: GameState): PlayerId | "draw" | null {
  if (state.phase === "game_over") return null;
  if (state.phase === "draw") return "draw";
  if (state.phase === "attacker_lead") return state.currentAttacker;
  if (state.phase === "defender_respond") return state.currentDefender;
  return null;
}

export function TurnIndicator({ state, localPlayer }: TurnIndicatorProps) {
  const acting = getActingPlayerId(state);
  const you = (id: PlayerId) => (id === localPlayer ? " (you)" : "");

  return (
    <header className="turn-indicator">
      <div className="turn-indicator__phase">Phase: {state.phase}</div>
      <div className="turn-indicator__roles">
        Attacker: P{state.currentAttacker}
        {you(state.currentAttacker)} · Defender: P{state.currentDefender}
        {you(state.currentDefender)}
      </div>
      <div className="turn-indicator__next">
        {acting === null && state.phase === "game_over" && state.winner !== undefined && (
          <span>Winner: Player {state.winner}</span>
        )}
        {acting === "draw" && <span>Next: both players draw</span>}
        {acting !== null && acting !== "draw" && (
          <span>
            To act: Player {acting}
            {you(acting)}
          </span>
        )}
      </div>
    </header>
  );
}
