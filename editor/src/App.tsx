import React, { useLayoutEffect, useRef, useState } from "react";

/** Per-character editor — SAME implementation, new layout
 * Top-right "Done", centered edit area, color row, font row + shuffle
 */

type Run = { text: string; fontFamily: string; color: string };
type EditType = "insertText" | "deleteContentBackward" | "insertFromPaste" | "insertLineBreak";

// Use the exact families you enabled (Google + self-hosted)
const FONTS = ["Bebas Neue", "Montserrat", "Graffiti Youth", "Redoura", "Super Woobly"];

// iOS-like palette from your screenshot
const PALETTE = ["#FF3B30", "#007AFF", "#34C759", "#AF52DE", "#FF9500", "#FFD60A"];
const DEFAULT_COLOR = "#111827";

/* ---------------- run helpers (unchanged) ---------------- */
const cloneRuns = (runs: Run[]) => runs.map((r) => ({ ...r }));
const mergeAdjacent = (runs: Run[]) => {
  const out: Run[] = [];
  for (const r of runs) {
    const last = out[out.length - 1];
    if (last && last.fontFamily === r.fontFamily && last.color === r.color) last.text += r.text;
    else out.push({ ...r });
  }
  return out;
};
const splitAt = (runs: Run[], offset: number): [Run[], Run[]] => {
  if (offset <= 0) return [[], cloneRuns(runs)];
  let acc = 0;
  const left: Run[] = [];
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    const next = acc + r.text.length;
    if (offset < next) {
      const k = offset - acc;
      if (k > 0) left.push({ ...r, text: r.text.slice(0, k) });
      const rightHeadText = r.text.slice(k);
      const right: Run[] = [];
      if (rightHeadText) right.push({ ...r, text: rightHeadText });
      for (let j = i + 1; j < runs.length; j++) right.push({ ...runs[j] });
      return [left, right];
    } else if (offset === next) {
      left.push({ ...r });
      const right: Run[] = [];
      for (let j = i + 1; j < runs.length; j++) right.push({ ...runs[j] });
      return [left, right];
    }
    left.push({ ...r });
    acc = next;
  }
  return [left, []];
};
const replaceRange = (
  runs: Run[], start: number, end: number, insertText: string,
  style: { fontFamily: string; color: string }
): Run[] => {
  const [A, tail] = splitAt(runs, start);
  const [_B, C] = splitAt(tail, Math.max(0, end - start));
  const mid = insertText ? [{ text: insertText, fontFamily: style.fontFamily, color: style.color }] : [];
  return mergeAdjacent([...A, ...mid, ...C]);
};
const getTextInRange = (runs: Run[], start: number, end: number) => {
  const [_A, tail] = splitAt(runs, start);
  const [B] = splitAt(tail, Math.max(0, end - start));
  return B.map((r) => r.text).join("");
};

/* ---------------- selection helpers (unchanged) ---------------- */
function getSelectionOffsets(root: HTMLElement): { start: number; end: number } {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { start: 0, end: 0 };
  const range = sel.getRangeAt(0);

  const toOffset = (node: Node, nodeOffset: number) => {
    let n: Node | null = node;
    while (n && n !== root && !(n.nodeType === 1 && (n as HTMLElement).hasAttribute("data-run"))) {
      n = (n as HTMLElement).parentNode;
    }
    if (!n || n === root) return 0;
    const idx = parseInt((n as HTMLElement).getAttribute("data-run") || "0", 10) || 0;
    let sum = 0;
    const spans = root.querySelectorAll<HTMLElement>("[data-run]");
    for (let i = 0; i < spans.length && i < idx; i++) sum += (spans[i].textContent || "").length;
    return sum + nodeOffset;
  };

  const start = toOffset(range.startContainer, range.startOffset);
  const end = toOffset(range.endContainer, range.endOffset);
  return { start: Math.min(start, end), end: Math.max(start, end) };
}
function setCaret(root: HTMLElement, runs: Run[], offset: number) {
  const spans = root.querySelectorAll<HTMLElement>("[data-run]");
  let acc = 0;
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    const len = (span.textContent || "").length;
    if (offset <= acc + len) {
      const rel = Math.max(0, offset - acc);
      const textNode = span.firstChild || span;
      const r = document.createRange();
      r.setStart(textNode, rel);
      r.setEnd(textNode, rel);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
      return;
    }
    acc += len;
  }
}

/* ---------------- apply one edit (unchanged) ---------------- */
function applyEdit(
  type: EditType, data: string | undefined, runs: Run[],
  currentFont: string, currentColor: string, editorEl: HTMLDivElement
) {
  const { start, end } = getSelectionOffsets(editorEl);
  let next = runs;
  let caret = start;

  if (type === "insertText") {
    const txt = data ?? "";
    next = replaceRange(runs, start, end, txt, { fontFamily: currentFont, color: currentColor });
    caret = start + txt.length;
  } else if (type === "deleteContentBackward") {
    if (start === end && start > 0) {
      next = replaceRange(runs, start - 1, start, "", { fontFamily: currentFont, color: currentColor });
      caret = start - 1;
    } else {
      next = replaceRange(runs, start, end, "", { fontFamily: currentFont, color: currentColor });
      caret = start;
    }
  } else if (type === "insertFromPaste") {
    const txt = (data ?? "").replace(/\n/g, " ");
    next = replaceRange(runs, start, end, txt, { fontFamily: currentFont, color: currentColor });
    caret = start + txt.length;
  } else if (type === "insertLineBreak") {
    next = replaceRange(runs, start, end, " ", { fontFamily: currentFont, color: currentColor });
    caret = start + 1;
  }
  return { next, caret };
}

/* ---------------- component ---------------- */
export default function App() {
  const [runs, setRuns] = useState<Run[]>([
    { text: "HELLO! TYPE HERE...", fontFamily: FONTS[0], color: DEFAULT_COLOR },
  ]);
  const [currentFont, setCurrentFont] = useState<string>(FONTS[0]);
  const [currentColor, setCurrentColor] = useState<string>(DEFAULT_COLOR);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const pendingCaret = useRef<number | null>(null);

  /* events (unchanged mechanics) */
  const onBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
    const evt = e.nativeEvent as unknown as InputEvent & { dataTransfer?: DataTransfer };
    const type = (evt as any).inputType as EditType | undefined;
    const data =
      type === "insertFromPaste"
        ? evt.dataTransfer?.getData("text/plain") || ""
        : ((evt as any).data as string | undefined);
    if (!type || !["insertText", "deleteContentBackward", "insertFromPaste", "insertLineBreak"].includes(type)) {
      return; // let browser handle
    }
    e.preventDefault(); // we take over
    const root = editorRef.current!;
    const { next, caret } = applyEdit(type, data, runs, currentFont, currentColor, root);
    setRuns(next);
    pendingCaret.current = caret;
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const root = editorRef.current!;
    if (!root) return;
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const { next, caret } = applyEdit("insertText", e.key, runs, currentFont, currentColor, root);
      setRuns(next);
      pendingCaret.current = caret;
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      const { next, caret } = applyEdit("deleteContentBackward", "", runs, currentFont, currentColor, root);
      setRuns(next);
      pendingCaret.current = caret;
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const { next, caret } = applyEdit("insertLineBreak", " ", runs, currentFont, currentColor, root);
      setRuns(next);
      pendingCaret.current = caret;
    }
  };

  // apply style to selection (unchanged)
  const applyFontToSelection = (font: string) => {
    editorRef.current?.focus();
    setCurrentFont(font);
    const root = editorRef.current!;
    const { start, end } = getSelectionOffsets(root);
    if (start === end) return;
    const text = getTextInRange(runs, start, end);
    const next = replaceRange(runs, start, end, text, { fontFamily: font, color: currentColor });
    setRuns(next);
  };
  const applyColorToSelection = (color: string) => {
    editorRef.current?.focus();
    setCurrentColor(color);
    const root = editorRef.current!;
    const { start, end } = getSelectionOffsets(root);
    if (start === end) return;
    const text = getTextInRange(runs, start, end);
    const next = replaceRange(runs, start, end, text, { fontFamily: currentFont, color });
    setRuns(next);
  };

  // shuffle button: random font + color on current selection (or update defaults if none)
  const shuffleSelection = () => {
    const randFont = FONTS[Math.floor(Math.random() * FONTS.length)];
    const randColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const root = editorRef.current!;
    const { start, end } = getSelectionOffsets(root);
    if (start === end) {
      setCurrentFont(randFont);
      setCurrentColor(randColor);
      return;
    }
    const text = getTextInRange(runs, start, end);
    const next = replaceRange(runs, start, end, text, { fontFamily: randFont, color: randColor });
    setRuns(next);
  };

  // caret restore
  useLayoutEffect(() => {
    if (pendingCaret.current != null && editorRef.current) {
      setCaret(editorRef.current, runs, pendingCaret.current);
      pendingCaret.current = null;
    }
  });

  // header "Done" -> just blur for now
  const handleDone = () => editorRef.current?.blur();

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Top bar with pill button on the right */}
      <div style={{ position: "sticky", top: 0, background: "#fff", padding: "8px 12px", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleDone}
            style={{
              padding: "6px 14px",
              borderRadius: 18,
              border: "1px solid #D1D5DB",
              background: "#F3F4F6",
              fontWeight: 700,
              fontSize: 18,
              boxShadow: "0 1px 0 rgba(0,0,0,0.15)",
            }}
          >
            Done
          </button>
        </div>
      </div>

      {/* Centered edit area */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <div style={{ width: "min(680px, 92vw)" }}>
          <div
            ref={editorRef}
            contentEditable
            role="textbox"
            aria-multiline="true"
            tabIndex={0}
            suppressContentEditableWarning
            spellCheck={false}
            onBeforeInput={onBeforeInput}
            onKeyDown={onKeyDown}
            style={{
              marginTop: 16,
              minHeight: "40vh",
              padding: 12,
              border: "1px solid #EEF2F7",
              borderRadius: 16,
              outline: "none",
              fontSize: 36,
              lineHeight: 1.2,
              textAlign: "center",   // <-- centered like your mock
              wordBreak: "break-word",
            }}
          >
            {runs.map((r, i) => (
              <span key={i} data-run={i} style={{ fontFamily: `${r.fontFamily}, sans-serif`, color: r.color }}>
                {r.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom controls pinned above keyboard */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "#fff",
          borderTop: "1px solid #E5E7EB",
          padding: "8px 12px",
        }}
      >
        <div style={{ width: "min(680px, 92vw)", margin: "0 auto", display: "grid", gap: 10 }}>
          {/* Color row */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", paddingTop: 4 }}>
            {PALETTE.map((c) => (
              <button
                key={c}
                aria-label={`color ${c}`}
                onClick={() => applyColorToSelection(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: c,
                  border: "2px solid " + (currentColor === c ? "#111" : "transparent"),
                  boxShadow: currentColor === c ? "0 0 0 2px #E5E7EB inset" : "none",
                }}
              />
            ))}
          </div>

          {/* Font row + shuffle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", flex: 1, paddingBottom: 4 }}>
              {FONTS.map((f) => (
                <button
                  key={f}
                  onClick={() => applyFontToSelection(f)}
                  style={{
                    flex: "0 0 auto",
                    padding: "2px 6px",
                    border: "none",
                    background: "transparent",
                    fontSize: 20,
                    lineHeight: 1.1,
                    fontFamily: `${f}, sans-serif`,
                    borderBottom: currentFont === f ? "3px solid #111" : "3px solid transparent",
                  }}
                >
                  Aa
                </button>
              ))}
            </div>

            <button
              onClick={shuffleSelection}
              title="Shuffle"
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                background: "#F9FAFB",
                fontSize: 18,
              }}
            >
              🔀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
