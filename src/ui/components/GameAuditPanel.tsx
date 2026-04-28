import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/** Pixels from the bottom that still count as "following" new events. */
const STICK_BOTTOM_THRESHOLD_PX = 40;

function isNearBottom(el: HTMLElement): boolean {
  const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
  return gap <= STICK_BOTTOM_THRESHOLD_PX;
}

export interface GameAuditPanelProps {
  lines: string[];
}

export function GameAuditPanel({ lines }: GameAuditPanelProps) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const searchId = useId();
  const regionId = useId();
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  /** True while the scroll position is at (or near) the bottom — new lines follow; pause when user scrolls up. */
  const stickToBottomRef = useRef(true);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      q
        ? lines.filter((line) => line.toLowerCase().includes(q))
        : lines,
    [lines, q]
  );

  const onScrollBody = useCallback(() => {
    const el = scrollBodyRef.current;
    if (!el) return;
    stickToBottomRef.current = isNearBottom(el);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const el = scrollBodyRef.current;
    if (!el || visible.length === 0) return;
    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [open, lines, q, visible.length]);

  return (
    <aside
      className="game-audit"
      aria-label="Game audit log"
    >
      <div className="game-audit__chrome">
        <button
          type="button"
          className="game-audit__toggle"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="game-audit__toggle-icon" aria-hidden>
            {open ? "▼" : "▶"}
          </span>
          Audit log
        </button>
        <label htmlFor={searchId} className="game-audit__search-label">
          Filter
        </label>
        <input
          id={searchId}
          type="search"
          className="game-audit__search"
          placeholder="Search events…"
          aria-label="Filter audit log"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!open}
        />
      </div>
      {open && (
        <div
          ref={scrollBodyRef}
          id={regionId}
          className="game-audit__body"
          role="region"
          aria-live="polite"
          aria-label="Audit log entries"
          onScroll={onScrollBody}
        >
          {visible.length === 0 ? (
            <p className="game-audit__empty">
              No lines match this filter.
            </p>
          ) : (
            <ol className="game-audit__list">
              {visible.map((line, i) => (
                <li key={`${i}-${line.slice(0, 24)}`} className="game-audit__item">
                  {line}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </aside>
  );
}
