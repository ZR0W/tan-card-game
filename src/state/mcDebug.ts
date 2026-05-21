/**
 * Story 4.3 — enable structured MC decision logging in the web app (browser only).
 *
 * - Build: set `VITE_MC_DEBUG=true` or `VITE_MC_DEBUG=1` in `.env` / `.env.local`.
 * - Runtime: `localStorage.setItem("tan:mcDebug", "1")` then reload (checked each move).
 */
export function isMcDebugEnabled(): boolean {
  try {
    if (
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      (import.meta.env.VITE_MC_DEBUG === "true" || import.meta.env.VITE_MC_DEBUG === "1")
    ) {
      return true;
    }
  } catch {
    /* import.meta unavailable */
  }
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("tan:mcDebug") === "1") {
      return true;
    }
  } catch {
    /* private mode */
  }
  return false;
}
