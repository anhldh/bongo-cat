import { useEffect, useRef, useState } from "react";
import { playClick } from "../audio";

export type MouseButton = "left" | "right" | null;

/** Vị trí con trỏ đã chuẩn hoá về 0..1 theo viewport, cộng nút đang giữ. */
export type MouseState = { u: number; v: number; button: MouseButton };

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

type Options = {
  /** false thì giữ nguyên vị trí đang có (nút bấm vẫn nhận), để rê chuột sang
   *  bảng chỉnh mà tay trong hình không chạy theo. */
  track?: boolean;
  sound?: boolean;
};

export function useMouse({ track = true, sound = true }: Options = {}) {
  const [state, setState] = useState<MouseState>({
    u: 0.5,
    v: 0.5,
    button: null,
  });
  /** Có nút nào đang giữ không — để chỉ kêu tiếng nhả khi thật sự có nhấn. */
  const held = useRef(false);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!track) return;
      setState((s) => ({
        ...s,
        u: clamp01(e.clientX / window.innerWidth),
        v: clamp01(e.clientY / window.innerHeight),
      }));
    };

    const onDown = (e: PointerEvent) => {
      const button =
        e.button === 0 ? "left" : e.button === 2 ? "right" : undefined;
      if (!button) return;
      held.current = true;
      setState((s) => ({ ...s, button }));
      if (sound) playClick("down");
    };

    // mất focus / pointercancel: nhả câm, vì không phải người dùng thả nút
    const clear = () => {
      held.current = false;
      setState((s) => ({ ...s, button: null }));
    };

    const onUp = () => {
      if (held.current && sound) playClick("up");
      clear();
    };

    // không chặn thì menu ngữ cảnh bung ra che mất con mèo mỗi lần chuột phải
    const onMenu = (e: Event) => e.preventDefault();

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", clear);
    window.addEventListener("blur", clear);
    window.addEventListener("contextmenu", onMenu);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", clear);
      window.removeEventListener("blur", clear);
      window.removeEventListener("contextmenu", onMenu);
    };
  }, [track, sound]);

  return state;
}
