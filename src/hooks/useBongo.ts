import { useCallback, useEffect, useRef, useState } from "react";
import { KEY_TO_SPRITE } from "../keymap";
import { playTap } from "../audio";

export function useBongo(sound = true) {
  /** Các sprite đang được nhấn, cũ -> mới. Phần tử cuối là phím vừa gõ. */
  const [pressed, setPressed] = useState<number[]>([]);
  /** e.code -> sprite, để giữ nhiều phím cùng lúc và nhả đúng phím */
  const held = useRef(new Map<string, number>());

  const sync = useCallback(() => {
    const v = [...held.current.values()];
    // ShiftLeft và ShiftRight cùng trỏ 1 sprite -> khử trùng, giữ lần cuối
    setPressed(v.filter((x, i) => v.lastIndexOf(x) === i));
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat || held.current.has(e.code)) return;
      const sprite = KEY_TO_SPRITE[e.code];
      if (sprite === undefined) return; // phím không có sprite -> bỏ qua
      held.current.set(e.code, sprite);
      sync();
      if (sound) playTap(sprite % 2 ? "left" : "right");
    };

    const onUp = (e: KeyboardEvent) => {
      if (!held.current.delete(e.code)) return;
      sync();
    };

    // đổi tab khi đang giữ phím -> keyup không bao giờ tới, phải reset
    const onBlur = () => {
      held.current.clear();
      sync();
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [sound, sync]);

  return { pressed, hand: pressed.at(-1) ?? null };
}
