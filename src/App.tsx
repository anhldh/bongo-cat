import { useState } from "react";
import { useBongo } from "./hooks/useBongo";
import { useMouse } from "./hooks/useMouse";
import { BongoCat } from "./components/BongoCat";
import { useTuning } from "./useTuning";

const MONO = 'ui-monospace, "JetBrains Mono", "SFMono-Regular", monospace';

export default function App() {
  const [sound, setSound] = useState(true);
  const { pressed, hand } = useBongo(sound);
  const { tuning, freezeMouse } = useTuning();
  const mouse = useMouse({ track: !freezeMouse, sound });

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeContent: "center",
        gap: 28,
        background: "#16232b",
        color: "#8fa3ad",
        fontFamily: MONO,
        userSelect: "none",
        touchAction: "manipulation",
        cursor: "pointer",
      }}
    >
      <BongoCat
        pressed={pressed}
        hand={hand}
        mouse={mouse}
        tuning={tuning}
        style={{ width: "min(90vw, 612px)" }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          fontSize: 13,
          letterSpacing: "0.04em",
        }}
      >
        <span>gõ phím, rê chuột, bấm chuột</span>
        <button
          onClick={() => setSound((s) => !s)}
          style={{
            font: "inherit",
            fontSize: 13,
            color: sound ? "#e8a33d" : "#5c717c",
            background: "none",
            border: `1px solid ${sound ? "#e8a33d" : "#2c3d47"}`,
            borderRadius: 999,
            padding: "4px 12px",
            cursor: "pointer",
          }}
        >
          {sound ? "âm thanh: bật" : "âm thanh: tắt"}
        </button>
      </div>
    </main>
  );
}
