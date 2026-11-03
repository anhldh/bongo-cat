import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, Keyboard } from "lucide-react";
import clsx from "clsx";
import type { KeyEvent } from "../../keyboard/useKeyTester";

const LOCATION = ["chuẩn", "bên trái", "bên phải", "bàn số"];

/** e.key của phím space là " ", hiện ra cho dễ nhìn */
const showKey = (k: string) => (k === " " ? "space" : k);

export function LastKey({ ev }: { ev: KeyEvent | undefined }) {
  return (
    <div className="flex flex-col rounded-2xl bg-panel p-5">
      <div className="text-xs text-sub">phím vừa bấm</div>
      {ev ? (
        <>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.12 }}
              className="my-3 truncate font-mono text-4xl text-main"
            >
              {showKey(ev.key)}
            </motion.div>
          </AnimatePresence>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs">
            <dt className="text-sub">code</dt>
            <dd className="truncate text-text">{ev.code}</dd>
            <dt className="text-sub">keyCode</dt>
            <dd className="text-text">{ev.keyCode}</dd>
            <dt className="text-sub">vị trí</dt>
            <dd className="text-text">{LOCATION[ev.location] ?? ev.location}</dd>
            {ev.hold !== undefined && (
              <>
                <dt className="text-sub">giữ</dt>
                <dd className="text-text">{Math.round(ev.hold)}ms</dd>
              </>
            )}
          </dl>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-sm text-sub">
          <Keyboard size={22} />
          bấm phím bất kỳ
        </div>
      )}
    </div>
  );
}

export function EventLog({ log }: { log: KeyEvent[] }) {
  return (
    <div className="flex min-h-0 flex-col rounded-2xl bg-panel p-5">
      <div className="mb-2 flex text-xs text-sub">
        <span>sự kiện</span>
        <span className="ml-auto">{log.length ? "mới nhất ở trên" : ""}</span>
      </div>
      <div className="h-44 overflow-y-auto pr-1 font-mono text-xs [scrollbar-width:thin]">
        {log.length === 0 && <div className="py-6 text-center text-sub">chưa có gì</div>}
        <AnimatePresence initial={false}>
          {log.map((e) => (
            <motion.div
              key={e.id}
              layout="position"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-[1rem_minmax(0,7rem)_minmax(0,1fr)_4.5rem_4.5rem] items-center gap-3 rounded-md px-1.5 py-1 odd:bg-bg/40"
            >
              {e.type === "down" ? (
                <ArrowDown size={12} className="text-main" />
              ) : (
                <ArrowUp size={12} className="text-sub" />
              )}
              <span className="truncate text-text">{e.code}</span>
              <span className="truncate text-sub">{showKey(e.key)}</span>
              <span className={clsx("text-right tabular-nums", e.chatter ? "text-err" : "text-sub")}>
                {e.chatter ? "double!" : e.hold !== undefined ? `${Math.round(e.hold)}ms` : ""}
              </span>
              <span className="text-right text-sub/70 tabular-nums">
                +{Math.round(e.gap)}ms
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
