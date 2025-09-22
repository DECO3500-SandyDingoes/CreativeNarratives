import React, { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onVerified: (pin: string) => Promise<void> | void;
  title?: string;
};

export default function PinModal({ open, onClose, onVerified, title }: Props) {
  const [pins, setPins] = useState<string[]>(["", "", "", ""]);
  const [err, setErr] = useState("");
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (open) {
      setPins(["", "", "", ""]);
      setErr("");
      setTimeout(() => inputRefs[0].current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const setDigit = (index: number, raw: string) => {
    if (err) setErr("");
    const clean = raw.replace(/\D/g, "");
    
    if (clean.length > 1) {
      setPins(prev => {
        const next = [...prev];
        let i = index;
        for (const ch of clean.slice(0, 4 - index)) {
          next[i++] = ch;
        }
        const empty = next.findIndex(d => d === "");
        (empty === -1 ? inputRefs[3] : inputRefs[empty]).current?.focus();
        return next;
      });
      return;
    }
    // Single digit
    setPins(prev => {
      const next = [...prev];
      next[index] = clean.slice(-1); // last char, numeric only
      if (clean && index < 3) inputRefs[index + 1].current?.focus();
      return next;
    });
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pins[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async () => {
    const pin = pins.join("");
    if (pin.length !== 4) return;
    try {
      await onVerified(pin);
    } catch {
      setErr("Wrong Pin, Try again");
    }
  };

  const isComplete = pins.join("").length === 4;
  const modalTitle = title || "Enter pin on the installation to post";

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.card} onClick={e => e.stopPropagation()}>
        <div style={styles.title}>{modalTitle}</div>

        <div style={styles.row}>
          {pins.map((val, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              value={val}
              onChange={e => setDigit(i, e.target.value)}
              onKeyDown={e => onKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              style={{ ...styles.box, borderColor: val ? "#111827" : "#E5E7EB", background: "#fff" }}
            />
          ))}
        </div>

        {err && <div style={styles.error}>{err}</div>}

        <div style={styles.buttons}>
          <button onClick={onClose} style={styles.btnGhost}>Cancel</button>
          <button onClick={handleSubmit} disabled={!isComplete} style={{ ...styles.btn, opacity: isComplete ? 1 : 0.5 }}>
            Verify Pin
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 },
  card: { width: "min(460px, 92vw)", background: "#F3F4F6", padding: 18, borderRadius: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.20)" },
  title: { fontWeight: 700, textAlign: "center", marginBottom: 12, color: "#111827" },
  row: { display: "flex", gap: 14, justifyContent: "center", margin: "10px 0" },
  box: { width: 64, height: 64, borderRadius: 12, border: "1px solid #E5E7EB", textAlign: "center", fontSize: 28, fontWeight: 800, outline: "none" },
  error: { color: "#b91c1c", textAlign: "center", marginTop: 8, fontSize: 14 },
  buttons: { display: "flex", gap: 12, justifyContent: "center", marginTop: 16 },
  btn: { background: "#111827", color: "white", fontWeight: 800, border: "none", padding: "12px 18px", borderRadius: 16, cursor: "pointer" },
  btnGhost: { background: "white", color: "#111827", fontWeight: 800, border: "1px solid #E5E7EB", padding: "12px 18px", borderRadius: 16, cursor: "pointer" },
};
