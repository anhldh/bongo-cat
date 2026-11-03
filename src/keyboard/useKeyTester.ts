import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Bắt mọi phím trên trang và ghi lại: phím nào đã nhận, đang giữ, số lần bấm,
 * nghi bị double (chatter) và số phím giữ cùng lúc nhiều nhất (rollover).
 */

export type KeyStat = {
  count: number;
  /** lần bấm lại quá sát lần nhả trước -> nghi switch bị double */
  chatter: number;
  /** thời gian giữ lâu nhất / gần nhất, ms */
  lastHold: number;
};

export type KeyEvent = {
  id: number;
  type: "down" | "up";
  key: string;
  code: string;
  keyCode: number;
  location: number;
  /** ms kể từ sự kiện trước */
  gap: number;
  /** chỉ có ở keyup: giữ bao lâu */
  hold?: number;
  chatter?: boolean;
};

/** nhả rồi bấm lại trong khoảng này thì gần như chắc là switch dội */
export const CHATTER_MS = 35;
const LOG_SIZE = 40;

/** Firefox cũ gọi phím Win là OS */
const normalize = (code: string) =>
  code === "OSLeft" ? "MetaLeft" : code === "OSRight" ? "MetaRight" : code;

/**
 * Phím không có cặp down/up đầy đủ: PrintScreen trên Windows chỉ có keyup,
 * CapsLock trên macOS bấm bật ra down, bấm tắt ra up. Gặp thì chỉ nháy.
 */
const FLASH_ONLY = new Set(["CapsLock", "PrintScreen"]);
const FLASH_MS = 160;

export function useKeyTester(enabled: boolean) {
  const [stats, setStats] = useState<Record<string, KeyStat>>({});
  const [held, setHeld] = useState<ReadonlySet<string>>(new Set());
  const [maxHeld, setMaxHeld] = useState(0);
  const [log, setLog] = useState<KeyEvent[]>([]);

  const downAt = useRef(new Map<string, number>());
  const upAt = useRef(new Map<string, number>());
  const lastEventAt = useRef(0);
  const nextId = useRef(0);
  const flashTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const push = useCallback((e: Omit<KeyEvent, "id" | "gap">, now: number) => {
    const gap = lastEventAt.current ? now - lastEventAt.current : 0;
    lastEventAt.current = now;
    const ev: KeyEvent = { ...e, id: nextId.current++, gap };
    setLog((l) => [ev, ...l].slice(0, LOG_SIZE));
  }, []);

  const press = useCallback((code: string, now: number) => {
    const lastUp = upAt.current.get(code);
    const chatter = lastUp !== undefined && now - lastUp < CHATTER_MS;
    setStats((s) => {
      const cur = s[code] ?? { count: 0, chatter: 0, lastHold: 0 };
      return {
        ...s,
        [code]: {
          ...cur,
          count: cur.count + 1,
          chatter: cur.chatter + (chatter ? 1 : 0),
        },
      };
    });
    return chatter;
  }, []);

  const setHeldKey = useCallback((code: string, on: boolean) => {
    setHeld((h) => {
      if (h.has(code) === on) return h;
      const n = new Set(h);
      if (on) n.add(code);
      else n.delete(code);
      if (on) setMaxHeld((m) => Math.max(m, n.size));
      return n;
    });
  }, []);

  const flash = useCallback(
    (code: string) => {
      setHeldKey(code, true);
      clearTimeout(flashTimers.current.get(code));
      flashTimers.current.set(
        code,
        setTimeout(() => setHeldKey(code, false), FLASH_MS),
      );
    },
    [setHeldKey],
  );

  const reset = useCallback(() => {
    setStats({});
    setHeld(new Set());
    setMaxHeld(0);
    setLog([]);
    downAt.current.clear();
    upAt.current.clear();
    lastEventAt.current = 0;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timers = flashTimers.current;

    const onDown = (e: KeyboardEvent) => {
      // trang này chỉ để thử phím: chặn hết hành vi mặc định (tab nhảy focus,
      // F5 tải lại, space cuộn trang...). Phím hệ điều hành vẫn lọt qua.
      e.preventDefault();
      if (e.repeat) return;
      const code = normalize(e.code);
      if (!code) return;
      const now = performance.now();
      const chatter = press(code, now);
      push(
        { type: "down", key: e.key, code, keyCode: e.keyCode, location: e.location, chatter },
        now,
      );
      downAt.current.set(code, now);
      if (FLASH_ONLY.has(code)) flash(code);
      else setHeldKey(code, true);
    };

    const onUp = (e: KeyboardEvent) => {
      e.preventDefault();
      const code = normalize(e.code);
      if (!code) return;
      const now = performance.now();
      const start = downAt.current.get(code);
      downAt.current.delete(code);

      if (start === undefined) {
        // up mà không thấy down (PrintScreen, CapsLock trên mac, phím giữ
        // từ trước khi vào trang) -> vẫn tính là phím đã nhận
        if (!FLASH_ONLY.has(code) || code === "PrintScreen") press(code, now);
        upAt.current.set(code, now);
        push({ type: "up", key: e.key, code, keyCode: e.keyCode, location: e.location }, now);
        flash(code);
        return;
      }

      upAt.current.set(code, now);
      const hold = now - start;
      setStats((s) => ({
        ...s,
        [code]: { ...(s[code] ?? { count: 1, chatter: 0, lastHold: 0 }), lastHold: hold },
      }));
      push({ type: "up", key: e.key, code, keyCode: e.keyCode, location: e.location, hold }, now);
      setHeldKey(code, false);
    };

    // đổi cửa sổ khi đang giữ -> không bao giờ có keyup, phải tự nhả
    const onBlur = () => {
      downAt.current.clear();
      setHeld(new Set());
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [enabled, press, push, flash, setHeldKey]);

  return { stats, held, maxHeld, log, reset };
}
