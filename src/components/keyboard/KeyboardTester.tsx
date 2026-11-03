import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import { Lock, LockOpen, RotateCcw, Tag } from "lucide-react";
import { buildLayout, SIZES, type OS, type Size, type Standard } from "../../keyboard/layouts";
import {
  keyboardApi,
  LABEL_LAYOUTS,
  labelFor,
  type KeyLabel,
  type LabelLayout,
} from "../../keyboard/labels";
import { CHATTER_MS, useKeyTester } from "../../keyboard/useKeyTester";
import { usePersistent } from "../../lib/usePersistent";
import { Bar, Opt, Sep } from "../ui/Segmented";
import { KeyboardView } from "./KeyboardView";
import { EventLog, LastKey } from "./EventLog";

type Config = { size: Size; std: Standard; os: OS; labels: LabelLayout };

const isMac = /mac|iphone|ipad/i.test(navigator.userAgent);
const DEFAULT: Config = {
  size: "tkl",
  std: "ansi",
  os: isMac ? "mac" : "win",
  labels: "qwerty",
};

const hasLayoutMap = !!keyboardApi()?.getLayoutMap;
const hasLock = !!keyboardApi()?.lock;

export function KeyboardTester() {
  const [stored, setConfig] = usePersistent<Config>("kb:config", DEFAULT);
  const config: Config = { ...DEFAULT, ...stored };
  const set = (p: Partial<Config>) => setConfig({ ...config, ...p });

  const { stats, held, maxHeld, log, reset } = useKeyTester(true);
  const [systemMap, setSystemMap] = useState<Map<string, string> | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // React Compiler tự memo các phép tính dưới đây, khỏi useMemo tay
  const layout = buildLayout(config.size, config.std, config.os);

  // nhãn theo bàn phím thật của máy (chỉ Chromium có API này)
  useEffect(() => {
    if (config.labels !== "system") return;
    let alive = true;
    keyboardApi()
      ?.getLayoutMap?.()
      .then((m) => alive && setSystemMap(m))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [config.labels]);

  const labels: Record<string, KeyLabel> = {};
  for (const k of layout.keys)
    labels[k.code] = labelFor(k.code, config.labels, config.os, systemMap);

  useEffect(() => {
    const onFs = () => {
      const on = !!document.fullscreenElement;
      setFullscreen(on);
      if (!on) keyboardApi()?.unlock?.();
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  /** Toàn màn hình + Keyboard Lock: bắt được cả Esc, Alt+Tab, phím Win... */
  const toggleLock = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
        await keyboardApi()?.lock?.();
      }
    } catch {
      /* trình duyệt từ chối thì thôi */
    }
  };

  // chỉ đếm phím thật trong sơ đồ (Fn không gửi gì nên bỏ)
  const testable = [
    ...new Set(layout.keys.filter((k) => !k.dummy).map((k) => k.code)),
  ];
  const inLayout = new Set(testable);
  const done = testable.filter((c) => stats[c]).length;
  const pct = testable.length ? done / testable.length : 0;
  const chatterKeys = Object.entries(stats).filter(([, s]) => s.chatter > 0);
  const outside = Object.keys(stats).filter((c) => !inLayout.has(c));

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <Bar>
          {SIZES.map((s) => (
            <Opt
              key={s.id}
              layoutGroup="kb-size"
              title={s.title}
              active={config.size === s.id}
              onClick={() => set({ size: s.id })}
            >
              {s.label}
            </Opt>
          ))}
          <Sep />
          {(["ansi", "iso"] as const).map((s) => (
            <Opt
              key={s}
              layoutGroup="kb-std"
              title={s === "ansi" ? "Enter ngang, Shift trái dài (kiểu Mỹ)" : "Enter chữ L, thêm phím cạnh Shift trái (kiểu Âu)"}
              active={config.std === s}
              onClick={() => set({ std: s })}
            >
              {s.toUpperCase()}
            </Opt>
          ))}
          <Sep />
          <Opt layoutGroup="kb-os" active={config.os === "win"} onClick={() => set({ os: "win" })}>
            Windows
          </Opt>
          <Opt layoutGroup="kb-os" active={config.os === "mac"} onClick={() => set({ os: "mac" })}>
            macOS
          </Opt>
        </Bar>
        <Bar>
          <Tag size={14} className="mx-1.5 text-sub" aria-hidden />
          {LABEL_LAYOUTS.filter((l) => l.id !== "system" || hasLayoutMap).map((l) => (
            <Opt
              key={l.id}
              layoutGroup="kb-labels"
              active={config.labels === l.id}
              onClick={() => set({ labels: l.id })}
              title={l.id === "system" ? "đọc nhãn từ layout bàn phím đang dùng trên máy" : undefined}
            >
              {l.label}
            </Opt>
          ))}
        </Bar>
      </div>

      {/* thống kê */}
      <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
        <div className="min-w-48 flex-1">
          <div className="flex items-baseline justify-between text-xs text-sub">
            <span>đã nhận</span>
            <span className="font-mono tabular-nums">{Math.round(pct * 100)}%</span>
          </div>
          <div className="font-mono text-2xl text-main tabular-nums">
            {done}
            <span className="text-base text-sub">/{testable.length}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel">
            <motion.div
              className="h-full rounded-full bg-ok"
              animate={{ width: `${pct * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
            />
          </div>
        </div>
        <Stat label="đang giữ" value={held.size} />
        <Stat label="giữ cùng lúc tối đa" value={maxHeld} title="số phím nhận cùng lúc (rollover). Bàn phím rẻ thường kẹt ở 6 hoặc ít hơn" />
        <Stat
          label="nghi double"
          value={chatterKeys.length}
          tone={chatterKeys.length ? "err" : undefined}
          title={`phím vừa nhả đã nhận lại trong vòng ${CHATTER_MS}ms, dấu hiệu switch bị dội`}
        />
        <div className="ml-auto flex gap-1">
          {hasLock && (
            <ToolBtn
              onClick={toggleLock}
              label={fullscreen ? "thoát toàn màn hình (giữ esc)" : "toàn màn hình + khoá phím hệ thống"}
            >
              {fullscreen ? <LockOpen size={16} /> : <Lock size={16} />}
            </ToolBtn>
          )}
          <ToolBtn onClick={reset} label="làm lại từ đầu">
            <RotateCcw size={16} />
          </ToolBtn>
        </div>
      </div>

      <KeyboardView layout={layout} labels={labels} held={held} stats={stats} />

      <div className="grid gap-6 md:grid-cols-[minmax(0,18rem)_1fr]">
        <LastKey ev={log[0]} />
        <EventLog log={log} />
      </div>

      {(outside.length > 0 || chatterKeys.length > 0) && (
        <div className="flex flex-col gap-3 text-sm">
          {chatterKeys.length > 0 && (
            <ChipRow label="nghi double" tone="err">
              {chatterKeys.map(([c, s]) => `${c} ×${s.chatter}`)}
            </ChipRow>
          )}
          {outside.length > 0 && <ChipRow label="phím ngoài sơ đồ">{outside}</ChipRow>}
        </div>
      )}

      <p className="text-xs leading-relaxed text-sub">
        Bấm lần lượt từng phím: phím đã nhận chuyển xanh, phím đang giữ sáng
        màu cam. Phím <kbd className="kbd">fn</kbd> xử lý ngay trong bàn phím
        nên không kiểm tra được. Một số phím như <kbd className="kbd">win</kbd>,{" "}
        <kbd className="kbd">alt+tab</kbd>, <kbd className="kbd">prt sc</kbd> có
        thể bị hệ điều hành giữ lại
        {hasLock ? " — bật nút khoá để bắt được chúng." : "."}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  title,
}: {
  label: string;
  value: ReactNode;
  tone?: "err";
  title?: string;
}) {
  return (
    <div title={title}>
      <div className="text-xs text-sub">{label}</div>
      <div
        className={clsx(
          "font-mono text-2xl tabular-nums",
          tone === "err" ? "text-err" : "text-main",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ToolBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      title={label}
      aria-label={label}
      className="grid size-9 place-items-center rounded-lg text-sub transition-colors hover:bg-panel hover:text-text"
    >
      {children}
    </button>
  );
}

function ChipRow({
  label,
  tone,
  children,
}: {
  label: string;
  tone?: "err";
  children: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-sub">{label}</span>
      {children.map((c) => (
        <span
          key={c}
          className={clsx(
            "rounded-md px-2 py-0.5 font-mono text-xs",
            tone === "err" ? "bg-err/15 text-err" : "bg-panel text-text",
          )}
        >
          {c}
        </span>
      ))}
    </div>
  );
}
