import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MousePointerClick, RotateCcw } from "lucide-react";
import clsx from "clsx";
import { DEFAULT_CONFIG, type Config } from "../../typing/engine";
import { useTypingEngine } from "../../typing/useTypingEngine";
import { load, save } from "../../lib/storage";
import { usePersistent } from "../../lib/usePersistent";
import { ConfigBar } from "./ConfigBar";
import { Words } from "./Words";
import { Results } from "./Results";

const PB_KEY = "typing:pb";

const pbKey = (c: Config) =>
  [
    c.mode,
    c.mode === "time" ? c.time : c.words,
    c.lang,
    c.punctuation ? "p" : "",
    c.numbers ? "n" : "",
  ].join(":");

type Props = {
  /** báo lên App để làm mờ header khi đang gõ */
  onRunningChange?: (running: boolean) => void;
};

export function TypingTest({ onRunningChange }: Props) {
  const [stored, setConfig] = usePersistent<Config>("typing:config", DEFAULT_CONFIG);
  // bản lưu cũ có thể thiếu trường mới
  const config: Config = { ...DEFAULT_CONFIG, ...stored };
  const { engine, snap } = useTypingEngine(config);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [prevBest, setPrevBest] = useState<number | null>(null);

  const running = snap.phase === "running";
  const done = snap.phase === "done";

  useEffect(() => onRunningChange?.(running), [running, onRunningChange]);

  // lưu kỷ lục theo từng kiểu bài
  useEffect(() => {
    engine.onFinish((r) => {
      const all = load<Record<string, number>>(PB_KEY, {});
      const k = pbKey(r.config);
      const prev = all[k] ?? null;
      setPrevBest(prev);
      if (r.wpm > 0 && r.wpm > (prev ?? 0)) save(PB_KEY, { ...all, [k]: r.wpm });
    });
    return () => engine.onFinish(null);
  }, [engine]);

  const focusInput = () => inputRef.current?.focus({ preventScroll: true });

  const restart = (repeat = false) => {
    engine.restart(repeat);
    // input có thể chưa mount lại (đang ở màn kết quả) -> đợi 1 frame
    requestAnimationFrame(focusInput);
  };

  const changeConfig = (c: Config) => {
    setConfig(c);
    engine.setConfig(c);
    requestAnimationFrame(focusInput);
  };

  // phím toàn cục: Tab làm lại, gõ bất kỳ thì tự focus vào ô gõ
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        engine.restart();
        requestAnimationFrame(() =>
          inputRef.current?.focus({ preventScroll: true }),
        );
        return;
      }
      if (engine.getSnapshot().phase === "done") return;
      const input = inputRef.current;
      if (!input || document.activeElement === input) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key.length === 1 || e.key === "Backspace") {
        // focus ngay trong keydown -> chính phím này được gõ vào ô luôn
        input.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine]);

  useEffect(() => {
    focusInput();
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " && !e.nativeEvent.isComposing) {
      e.preventDefault();
      engine.space();
    } else if (e.key === "Backspace" && e.currentTarget.value === "") {
      e.preventDefault();
      engine.backspaceAtStart(e.ctrlKey || e.altKey || e.metaKey);
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const remaining =
    config.mode === "time"
      ? String(Math.max(0, config.time - snap.elapsed))
      : `${snap.typed.length}/${snap.words.length}`;

  return (
    <div className="flex w-full flex-col gap-10">
      <ConfigBar config={config} onChange={changeConfig} dimmed={running} />

      <AnimatePresence mode="wait" initial={false}>
        {!done || !snap.result ? (
          <motion.section
            key="test"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            {/* tiến độ + số liệu sống */}
            <div
              className={clsx(
                "mb-2 flex h-9 items-baseline gap-6 font-mono transition-opacity duration-200",
                running ? "opacity-100" : "opacity-0",
              )}
            >
              <span className="text-3xl text-main tabular-nums">{remaining}</span>
              <span className="text-lg text-sub tabular-nums">
                {Math.round(snap.liveWpm)} <span className="text-xs">wpm</span>
              </span>
              <span className="text-lg text-sub tabular-nums">
                {Math.round(snap.liveAcc)}
                <span className="text-xs">%</span>
              </span>
            </div>

            <div className="relative" onClick={focusInput}>
              <input
                ref={inputRef}
                value={snap.input}
                onChange={(e) => engine.input(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label="ô gõ"
                className="absolute inset-0 z-0 h-full w-full cursor-default opacity-0"
              />
              <motion.div
                key={snap.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={clsx(
                  "pointer-events-none relative transition-[filter,opacity] duration-300",
                  !focused && "opacity-40 blur-[5px]",
                )}
              >
                <Words
                  words={snap.words}
                  typed={snap.typed}
                  input={snap.input}
                  focused={focused}
                  testId={snap.id}
                />
              </motion.div>

              <AnimatePresence>
                {!focused && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-sm text-text"
                  >
                    <MousePointerClick size={16} />
                    bấm vào đây hoặc gõ phím bất kỳ để bắt đầu
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => restart()}
                title="bài mới (tab)"
                aria-label="bài mới"
                className="grid size-10 place-items-center rounded-xl text-sub transition-colors hover:bg-panel hover:text-text"
              >
                <RotateCcw size={17} />
              </button>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
          >
            <Results
              result={snap.result}
              prevBest={prevBest}
              onNext={() => restart()}
              onRepeat={() => restart(true)}
            />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
