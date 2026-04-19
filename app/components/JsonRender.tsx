import { useCallback, useEffect, useMemo, useRef } from "react";
import { tokenizeJson, Token, TokenType } from "~/utilities/jsonTokenize";
import { CopyTextButton } from "./CopyTextButton";

export type JsonRenderProps = {
  code: string;
  highlightLines?: { from: number; to: number };
  selectedLine?: number;
  onSelectedLineChange?: (line: number) => void;
  focusable?: boolean;
  className?: string;
  showCopyButton?: boolean;
};

const TOKEN_CLASS: Record<TokenType, string> = {
  key: "text-[#e06c75]",
  string: "text-[#98c379]",
  number: "text-[#e5c07b]",
  boolean: "text-[#d19a66]",
  null: "text-[#d19a66]",
  punct: "text-slate-600 dark:text-[#abb2bf]",
  whitespace: "",
};

function renderTokens(tokens: Token[]): JSX.Element[] {
  return tokens.map((t, i) => {
    if (t.type === "whitespace") {
      return <span key={i}>{t.text}</span>;
    }
    return (
      <span key={i} className={TOKEN_CLASS[t.type]}>
        {t.text}
      </span>
    );
  });
}

export function JsonRender({
  code,
  highlightLines,
  selectedLine,
  onSelectedLineChange,
  focusable,
  className,
  showCopyButton,
}: JsonRenderProps) {
  const lines = useMemo(() => tokenizeJson(code), [code]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const selected = selectedLine ?? 0;

  const moveLine = useCallback(
    (delta: number, absolute?: number) => {
      if (!onSelectedLineChange) return;
      const current = selected || 1;
      let next = absolute ?? current + delta;
      next = Math.max(1, Math.min(lines.length, next));
      if (next !== current) onSelectedLineChange(next);
    },
    [selected, lines.length, onSelectedLineChange]
  );

  useEffect(() => {
    if (!selectedLine) return;
    const el = lineRefs.current[selectedLine - 1];
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedLine]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!focusable || !onSelectedLineChange) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          moveLine(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          moveLine(-1);
          break;
        case "PageDown": {
          e.preventDefault();
          const h = containerRef.current?.clientHeight ?? 0;
          const lineH = lineRefs.current[0]?.clientHeight ?? 20;
          moveLine(Math.max(1, Math.floor(h / lineH) - 1));
          break;
        }
        case "PageUp": {
          e.preventDefault();
          const h = containerRef.current?.clientHeight ?? 0;
          const lineH = lineRefs.current[0]?.clientHeight ?? 20;
          moveLine(-Math.max(1, Math.floor(h / lineH) - 1));
          break;
        }
        case "Home":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            moveLine(0, 1);
          }
          break;
        case "End":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            moveLine(0, lines.length);
          }
          break;
      }
    },
    [focusable, onSelectedLineChange, moveLine, lines.length]
  );

  const inHighlight = (n: number) =>
    highlightLines !== undefined &&
    n >= highlightLines.from &&
    n <= highlightLines.to;

  return (
    <div className={`group relative h-full w-full ${className ?? ""}`}>
      <div
        ref={containerRef}
        tabIndex={focusable ? 0 : -1}
        onKeyDown={onKeyDown}
        role={focusable ? "textbox" : undefined}
        aria-readonly={focusable ? true : undefined}
        className="h-full overflow-auto font-mono text-sm leading-[1.5] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-[#abb2bf] outline-none focus:outline-none"
      >
        {lines.map((tokens, idx) => {
          const lineNumber = idx + 1;
          const isSelected = focusable && lineNumber === selected;
          const isHighlighted = inHighlight(lineNumber);
          const lineClass = [
            "whitespace-pre px-3",
            isHighlighted ? "bg-yellow-500/30" : "",
            isSelected ? "bg-slate-200 dark:bg-slate-700" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div
              key={idx}
              ref={(el) => (lineRefs.current[idx] = el)}
              data-line={lineNumber}
              onMouseDown={
                focusable && onSelectedLineChange
                  ? () => onSelectedLineChange(lineNumber)
                  : undefined
              }
              className={lineClass}
            >
              {tokens.length === 0 ? "\u200b" : renderTokens(tokens)}
            </div>
          );
        })}
      </div>
      {showCopyButton && (
        <div className="absolute top-1 right-0 flex w-full justify-end opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <CopyTextButton
            value={code}
            className="mr-1 h-fit rounded-sm bg-slate-200 px-2 py-0.5 transition hover:cursor-pointer hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
          />
        </div>
      )}
    </div>
  );
}
