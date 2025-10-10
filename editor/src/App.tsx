import React, { useCallback, useLayoutEffect, useRef, useState, useEffect } from "react";
import { send, type Run } from "../../shared/shared"
import PinModal from "./Pin";

// font and colour options
type EditType = "insertText" | "deleteContentBackward" | "insertFromPaste" | "insertLineBreak";

const FONTS = ["Bebas Neue", "Montserrat", "Graffiti Youth", "Redoura", "Super Woobly"];
const PALETTE = ["#FF3B30", "#007AFF", "#34C759", "#AF52DE", "#FF9500", "#FFD60A"];
const DEFAULT_COLOR = "#FF3B30";
const FOOTER_H = 92;
const MOBILE_FOOTER_H = 120;

const cloneRuns = (runs: Run[]) => runs.map((r) => ({ ...r }));

const mergeAdjacent = (runs: Run[]) => {
  const out: Run[] = [];
  for (const r of runs) {
    const last = out[out.length - 1];
    if (last && last.fontFamily === r.fontFamily && last.color === r.color) {
      last.text += r.text;
    } else {
      out.push({ ...r });
    }
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
  runs: Run[], 
  start: number, 
  end: number, 
  insertText: string,
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

//Selection helpers
function getSelectionOffsets(root: HTMLElement): { start: number; end: number } {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { start: 0, end: 0 };
  
  const range = sel.getRangeAt(0);
  const runEls = Array.from(root.querySelectorAll<HTMLElement>("[data-run]"));

  const textLenBeforeRun = (i: number) =>
    runEls.slice(0, i).reduce((sum, el) => sum + (el.textContent?.length || 0), 0);

  function toAbsolute(container: Node, offset: number): number {
    let el: HTMLElement | null =
      container.nodeType === Node.TEXT_NODE 
        ? (container.parentElement as HTMLElement) 
        : (container as HTMLElement);

    while (el && el !== root && !el.hasAttribute("data-run")) {
      el = el.parentElement as HTMLElement | null;
    }

    if (el && el !== root && el.hasAttribute("data-run")) {
      const idx = Number(el.getAttribute("data-run") || 0);
      const rel = container.nodeType === Node.TEXT_NODE
          ? offset
        : Math.min(offset, el.textContent?.length || 0);
      return textLenBeforeRun(idx) + rel;
    }

    let sum = 0;
    const childIndex = Math.max(0, Math.min(offset, root.childNodes.length));
    for (let i = 0; i < childIndex; i++) {
      const n = root.childNodes[i] as HTMLElement;
      if (n.nodeType === Node.ELEMENT_NODE && n.hasAttribute("data-run")) {
        sum += n.textContent?.length || 0;
      }
    }
    return sum;
  }

  const start = toAbsolute(range.startContainer, range.startOffset);
  const end = toAbsolute(range.endContainer, range.endOffset);
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

function setCaret(root: HTMLElement, _runs: Run[], offset: number) {
  const spans = root.querySelectorAll<HTMLElement>("[data-run]");
  let acc = 0;
  
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    const len = span.textContent?.length || 0;
    
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

//edit options
function applyEdit(
  type: EditType, 
  data: string | undefined, 
  runs: Run[],
  currentFont: string, 
  currentColor: string, 
  editorEl: HTMLDivElement
) {
  const { start, end } = getSelectionOffsets(editorEl);
  let next = runs;
  let caret = start;

  const createEmptyRun = () => [{ text: "", fontFamily: currentFont, color: currentColor }];
  const createRunWithText = (text: string) => [{ text, fontFamily: currentFont, color: currentColor }];

  switch (type) {
    case "insertText": {
    const txt = data ?? "";
      if (runs.length === 0) {
        next = createRunWithText(txt);
        caret = txt.length;
      } else {
    next = replaceRange(runs, start, end, txt, { fontFamily: currentFont, color: currentColor });
    caret = start + txt.length;
      }
      break;
    }
    
    case "deleteContentBackward": {
    if (start === end && start > 0) {
      next = replaceRange(runs, start - 1, start, "", { fontFamily: currentFont, color: currentColor });
      caret = start - 1;
    } else {
      next = replaceRange(runs, start, end, "", { fontFamily: currentFont, color: currentColor });
      caret = start;
    }
      
      if (next.length === 0 || (next.length === 1 && next[0].text === "")) {
        next = createEmptyRun();
        caret = 0;
      }
      break;
    }
    
    case "insertFromPaste": {
    const txt = (data ?? "").replace(/\n/g, " ");
      if (runs.length === 0) {
        next = createRunWithText(txt);
        caret = txt.length;
      } else {
    next = replaceRange(runs, start, end, txt, { fontFamily: currentFont, color: currentColor });
    caret = start + txt.length;
      }
      break;
    }
    
    case "insertLineBreak": {
      if (runs.length === 0) {
        next = createRunWithText(" ");
        caret = 1;
      } else {
    next = replaceRange(runs, start, end, " ", { fontFamily: currentFont, color: currentColor });
    caret = start + 1;
  }
      break;
    }
  }

  if (next.length === 0) {
    next = createEmptyRun();
    caret = 0;
  }

  return { next, caret };
}

// CUSTOM HOOKS
function useFontLoading() {
  const [fontLoadStatus, setFontLoadStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkFontLoad = async () => {
      const fontStatus: Record<string, boolean> = {};
      
      for (const font of FONTS) {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          
          ctx.font = '16px "Arial", sans-serif';
          const fallbackWidth = ctx.measureText('Test').width;
          
          ctx.font = `16px "${font}", "Arial", sans-serif`;
          const fontWidth = ctx.measureText('Test').width;
          
          fontStatus[font] = Math.abs(fontWidth - fallbackWidth) > 0.1;
        } catch (error) {
          console.warn(`Font check failed for ${font}:`, error);
          fontStatus[font] = false;
        }
      }
      
      setFontLoadStatus(fontStatus);
    };

    const timer = setTimeout(checkFontLoad, 1000);
    return () => clearTimeout(timer);
  }, []);

  return fontLoadStatus;
}

function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [initialViewportHeight, setInitialViewportHeight] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || 
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      
      if (isMobileDevice) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
        }
        
        // Store initial viewport height
        const initialHeight = window.visualViewport?.height || window.innerHeight;
        setInitialViewportHeight(initialHeight);
      }
    };
    
    const handleResize = () => {
      if (isMobile) {
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const heightDifference = initialViewportHeight - currentHeight;
        const isOpen = heightDifference > 100; // Lowered threshold for better detection
        
        setIsKeyboardOpen(isOpen);
        setKeyboardHeight(isOpen ? heightDifference : 0);
      }
    };

    const handleVisualViewportChange = () => {
      if (isMobile && window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDifference = initialViewportHeight - currentHeight;
        const isOpen = heightDifference > 100;
        
        setIsKeyboardOpen(isOpen);
        setKeyboardHeight(isOpen ? heightDifference : 0);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [isMobile, initialViewportHeight]);

  return { isMobile, isKeyboardOpen, keyboardHeight };
}

const createTouchHandlers = (isMobile: boolean) => ({
  onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile) e.currentTarget.style.transform = "scale(0.95)";
  },
  onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  },
  onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => {
    if (isMobile) {
      e.currentTarget.style.transform = "scale(0.95)";
      e.currentTarget.style.transition = "transform 0.1s ease";
    }
  },
  onTouchEnd: (e: React.TouchEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  },
  onTouchCancel: (e: React.TouchEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  }
});

interface ButtonProps {
  children?: React.ReactNode;
  onClick: () => void;
  style?: React.CSSProperties;
  isMobile: boolean;
  title?: string;
  ariaLabel?: string;
}

const TouchButton: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  style, 
  isMobile, 
  title, 
  ariaLabel 
}) => {
  const touchHandlers = createTouchHandlers(isMobile);
  
  return (
    <button
      onClick={onClick}
      style={style}
      title={title}
      aria-label={ariaLabel}
      {...touchHandlers}
    >
      {children}
    </button>
  );
};

interface ColorButtonProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
  isMobile: boolean;
}

const ColorButton: React.FC<ColorButtonProps> = ({ color, isSelected, onClick, isMobile }) => (
  <TouchButton
    onClick={onClick}
    isMobile={isMobile}
    ariaLabel={`color ${color}`}
    style={{
      width: isMobile ? 36 : 28,
      height: isMobile ? 36 : 28,
      borderRadius: "50%",
      background: color,
      border: `2px solid ${isSelected ? "#111" : "transparent"}`,
      boxShadow: isSelected ? "0 0 0 2px #E5E7EB inset" : "none",
      transition: "transform 0.1s ease",
      cursor: "pointer"
    }}
  />
);

interface FontButtonProps {
  font: string;
  isSelected: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  onClick: () => void;
  isMobile: boolean;
}

const FontButton: React.FC<FontButtonProps> = ({ 
  font, 
  isSelected, 
  isLoaded, 
  isLoading, 
  onClick, 
  isMobile 
}) => (
  <TouchButton
    onClick={onClick}
    isMobile={isMobile}
    title={`${font}${!isLoaded ? ' (loading...)' : ''}`}
    style={{
      flex: "0 0 auto",
      padding: isMobile ? "8px 12px" : "2px 6px",
      border: "none",
      background: "transparent",
      fontSize: isMobile ? 24 : 20,
      lineHeight: 1.1,
      fontFamily: `${font}, sans-serif`,
      borderBottom: isSelected ? "3px solid #111" : "3px solid transparent",
      transition: "all 0.1s ease",
      cursor: "pointer",
      minWidth: isMobile ? 48 : "auto",
      opacity: isLoaded ? 1 : 0.6,
      position: "relative"
    }}
  >
    Aa
    {isLoading && (
      <div style={{
        position: "absolute",
        top: -2,
        right: -2,
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "#FFD60A",
        animation: "pulse 1s infinite"
      }} />
    )}
  </TouchButton>
);

export default function App() {
  // State
  const [runs, setRuns] = useState<Run[]>([
    { text: "HELLO! TYPE HERE...", fontFamily: FONTS[0], color: DEFAULT_COLOR },
  ]);
  const [currentFont, setCurrentFont] = useState<string>(FONTS[0]);
  const [currentColor, setCurrentColor] = useState<string>(DEFAULT_COLOR);
  const [pinOpen, setPinOpen] = useState(false);

  // Refs
  const editorRef = useRef<HTMLDivElement | null>(null);
  const pendingCaret = useRef<number | null>(null);

  // Custom hooks
  const fontLoadStatus = useFontLoading();
  const { isMobile, isKeyboardOpen, keyboardHeight } = useMobileDetection();

  //checks and handles what action is being done by the user
  const onBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
    const evt = e.nativeEvent as unknown as InputEvent & { dataTransfer?: DataTransfer };
    const type = (evt as any).inputType as EditType | undefined;
    const data = type === "insertFromPaste"
        ? evt.dataTransfer?.getData("text/plain") || ""
        : ((evt as any).data as string | undefined);
    
    if (!type || !["insertText", "deleteContentBackward", "insertFromPaste", "insertLineBreak"].includes(type)) {
      return;
    }
    
    e.preventDefault();
    const root = editorRef.current!;
    const { next, caret } = applyEdit(type, data, runs, currentFont, currentColor, root);
    setRuns(next);
    pendingCaret.current = caret;
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const txt = e.clipboardData.getData("text/plain").replace(/\r?\n/g, " ");
    const root = editorRef.current!;
    const { next, caret } = applyEdit("insertFromPaste", txt, runs, currentFont, currentColor, root);
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

  const applyFontToSelection = (font: string) => {
    editorRef.current?.focus();
    setCurrentFont(font);
    
    // Always update the current font state for future typing
    const root = editorRef.current!;
    const { start, end } = getSelectionOffsets(root);
    
    // If text is selected, apply font to the selection
    if (start !== end) {
    const text = getTextInRange(runs, start, end);
    const next = replaceRange(runs, start, end, text, { fontFamily: font, color: currentColor });
    setRuns(next);
    }
    // If no text is selected, the font is set for future typing via setCurrentFont
  };

  const applyColorToSelection = (color: string) => {
    editorRef.current?.focus();
    setCurrentColor(color);
    
    // Always update the current color state for future typing
    const root = editorRef.current!;
    const { start, end } = getSelectionOffsets(root);
    
    // If text is selected, apply color to the selection
    if (start !== end) {
    const text = getTextInRange(runs, start, end);
    const next = replaceRange(runs, start, end, text, { fontFamily: currentFont, color });
    setRuns(next);
    }
    // If no text is selected, the color is set for future typing via setCurrentColor
  };

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

  const handleDone = () => setPinOpen(true);

  const onVerifiedPin = useCallback(async (pin: string) => {
    if (!/^\d{4}$/.test(pin)) throw new Error("Wrong PIN, try again");

    try {
      const statusMessage = await send({ content: runs, code: pin });
      alert("Success: " + statusMessage);
      setPinOpen(false);
    } catch (err) {
      throw new Error(String(err));
    }
  }, [runs]);

  //caret restore
  useLayoutEffect(() => {
    if (pendingCaret.current != null && editorRef.current) {
      setCaret(editorRef.current, runs, pendingCaret.current);
      pendingCaret.current = null;
    }
  });

  //computed mobile values
  const footerHeight = isMobile ? MOBILE_FOOTER_H : FOOTER_H;
  const bottomPadding = isMobile && isKeyboardOpen ? 0 : footerHeight + 8;
  
  // Dynamic bottom position based on keyboard height
  const bottomControlsPosition = isMobile && isKeyboardOpen 
    ? `${keyboardHeight}px` 
    : "0px";

  return (
    <div style={{ 
      minHeight: "100dvh", 
      background: "#fff", 
      display: "flex", 
      flexDirection: "column", 
      paddingBottom: bottomPadding,
      touchAction: isMobile ? "manipulation" : "auto",
      WebkitTouchCallout: isMobile ? "none" : "default",
      WebkitUserSelect: "text",
      userSelect: "text"
    }}>
      {/* Top bar */}
      <div style={{ position: "sticky", top: 0, background: "#fff", padding: "8px 12px", zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <TouchButton
            onClick={handleDone}
            isMobile={isMobile}
            style={{
              padding: isMobile ? "10px 18px" : "6px 14px",
              borderRadius: isMobile ? 22 : 18,
              border: "1px solid #D1D5DB",
              background: "#F3F4F6",
              fontWeight: 700,
              fontSize: isMobile ? 20 : 18,
              boxShadow: "0 1px 0 rgba(0,0,0,0.15)",
              minHeight: isMobile ? 44 : "auto",
              touchAction: "manipulation",
              cursor: "pointer"
            }}
          >
            Done
          </TouchButton>
        </div>
      </div>

      {/* Editor area */}
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
            onPaste={onPaste}
            onTouchStart={(e) => {
              if (isMobile && e.touches.length > 1) {
                e.preventDefault();
              }
            }}
            onTouchEnd={() => {
              if (isMobile) {
                const selection = window.getSelection();
                if (selection && selection.toString().length > 0) {
                  editorRef.current?.focus();
                }
              }
            }}
            onClick={() => {
              if (runs.length === 0) {
                setRuns([{ text: "", fontFamily: currentFont, color: currentColor }]);
              }
            }}
            style={{
              marginTop: 16,
              minHeight: isMobile 
                ? (isKeyboardOpen ? "20vh" : "30vh") 
                : "40vh",
              padding: isMobile ? 16 : 12,
              border: "1px solid #EEF2F7",
              borderRadius: isMobile ? 20 : 16,
              outline: "none",
              fontSize: isMobile ? 32 : 36,
              lineHeight: 1.2,
              textAlign: "center",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              overflowY: "auto",
              touchAction: "manipulation",
              WebkitUserSelect: "text",
              userSelect: "text",
              transition: "min-height 0.3s ease-in-out" // Smooth height transition
            }}
          >
            {runs.length === 0 ? (
              <span 
                data-run={0} 
                style={{ 
                  fontFamily: `${currentFont}, sans-serif`, 
                  color: currentColor,
                  opacity: 0.5
                }}
              >
                HELLO! TYPE HERE...
              </span>
            ) : (
              runs.map((r, i) => (
              <span key={i} data-run={i} style={{ fontFamily: `${r.fontFamily}, sans-serif`, color: r.color }}>
                {r.text}
              </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: bottomControlsPosition,
          background: "#fff",
          borderTop: "1px solid #E5E7EB",
          padding: isMobile ? "12px 16px" : "8px 12px",
          height: footerHeight,
          zIndex: 50,
          boxShadow: isMobile ? "0 -2px 10px rgba(0,0,0,0.1)" : "none",
          transition: "bottom 0.3s ease-in-out" // Smooth animation when keyboard opens/closes
        }}
      >
        <div style={{ width: "min(680px, 92vw)", margin: "0 auto", display: "grid", gap: isMobile ? 12 : 10 }}>
          {/* Color row */}
          <div style={{ display: "flex", gap: isMobile ? 20 : 16, justifyContent: "center", paddingTop: 4 }}>
            {PALETTE.map((color) => (
              <ColorButton
                key={color}
                color={color}
                isSelected={currentColor === color}
                onClick={() => applyColorToSelection(color)}
                isMobile={isMobile}
              />
            ))}
          </div>

          {/* Font row + shuffle */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 12 }}>
            <div style={{ display: "flex", gap: isMobile ? 16 : 12, overflowX: "auto", flex: 1, paddingBottom: 4 }}>
              {FONTS.map((font) => (
                <FontButton
                  key={font}
                  font={font}
                  isSelected={currentFont === font}
                  isLoaded={fontLoadStatus[font] !== false}
                  isLoading={fontLoadStatus[font] === undefined}
                  onClick={() => applyFontToSelection(font)}
                  isMobile={isMobile}
                />
              ))}
            </div>

            <TouchButton
              onClick={shuffleSelection}
              isMobile={isMobile}
              title="Shuffle"
              style={{
                width: isMobile ? 44 : 36,
                height: isMobile ? 44 : 36,
                borderRadius: isMobile ? 16 : 12,
                border: "1px solid #E5E7EB",
                background: "#F9FAFB",
                fontSize: isMobile ? 22 : 18,
                cursor: "pointer",
                transition: "transform 0.1s ease"
              }}
            >
              🔀
            </TouchButton>
          </div>
        </div>
      </div>

      <PinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onVerified={onVerifiedPin}
        title="Enter pin from the projecton"
      />
    </div>
  );
}