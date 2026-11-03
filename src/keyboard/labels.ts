import type { OS } from "./layouts";

/**
 * Nhãn in trên phím. Vị trí phím (code) không đổi, chỉ chữ in trên đó đổi theo
 * layout gõ mà người dùng chọn.
 */

export type LabelLayout =
  | "qwerty"
  | "qwertz"
  | "azerty"
  | "dvorak"
  | "colemak"
  | "system";

export const LABEL_LAYOUTS: { id: LabelLayout; label: string }[] = [
  { id: "qwerty", label: "QWERTY" },
  { id: "qwertz", label: "QWERTZ" },
  { id: "azerty", label: "AZERTY" },
  { id: "dvorak", label: "Dvorak" },
  { id: "colemak", label: "Colemak" },
  { id: "system", label: "theo máy" },
];

/** Các phím ký tự theo thứ tự vật lý từng hàng. */
const ROW_CODES = [
  ["Backquote", ..."1234567890".split("").map((d) => `Digit${d}`), "Minus", "Equal"],
  [..."QWERTYUIOP".split("").map((c) => `Key${c}`), "BracketLeft", "BracketRight", "Backslash"],
  [..."ASDFGHJKL".split("").map((c) => `Key${c}`), "Semicolon", "Quote"],
  ["IntlBackslash", ..."ZXCVBNM".split("").map((c) => `Key${c}`), "Comma", "Period", "Slash"],
];

/** Mỗi layout: 4 chuỗi khớp từng ký tự với ROW_CODES. */
const CHARS: Record<Exclude<LabelLayout, "system">, string[]> = {
  qwerty: ["`1234567890-=", "qwertyuiop[]\\", "asdfghjkl;'", "\\zxcvbnm,./"],
  qwertz: ["^1234567890ß´", "qwertzuiopü+#", "asdfghjklöä", "<yxcvbnm,.-"],
  azerty: ["²&é\"'(-è_çà)=", "azertyuiop^$*", "qsdfghjklmù", "<wxcvbn,;:!"],
  dvorak: ["`1234567890[]", "',.pyfgcrl/=\\", "aoeuidhtns-", "\\;qjkxbmwvz"],
  colemak: ["`1234567890-=", "qwfpgjluy;[]\\", "arstdhneio'", "\\zxcvbkm,./"],
};

/** Ký tự khi giữ Shift, chỉ in cho layout US cho đỡ rối. */
const SHIFT_US = ["~!@#$%^&*()_+", "QWERTYUIOP{}|", "ASDFGHJKL:\"", "|ZXCVBNM<>?"];

function charMap(rows: string[]) {
  const m: Record<string, string> = {};
  ROW_CODES.forEach((codes, r) => {
    const chars = [...rows[r]];
    codes.forEach((c, i) => {
      if (chars[i] !== undefined) m[c] = chars[i];
    });
  });
  return m;
}

const MAPS = Object.fromEntries(
  Object.entries(CHARS).map(([k, v]) => [k, charMap(v)]),
) as Record<Exclude<LabelLayout, "system">, Record<string, string>>;
const SHIFT_MAP = charMap(SHIFT_US);

/** Nhãn các phím chức năng. [Windows, macOS] */
const NAMED: Record<string, [string, string?]> = {
  Escape: ["esc"],
  Backspace: ["backspace", "delete"],
  Tab: ["tab"],
  CapsLock: ["caps lock"],
  Enter: ["enter", "return"],
  ShiftLeft: ["shift"],
  ShiftRight: ["shift"],
  ControlLeft: ["ctrl", "⌃ control"],
  ControlRight: ["ctrl", "⌃ control"],
  MetaLeft: ["win", "⌘ cmd"],
  MetaRight: ["win", "⌘ cmd"],
  AltLeft: ["alt", "⌥ opt"],
  AltRight: ["alt", "⌥ opt"],
  ContextMenu: ["menu"],
  Fn: ["fn"],
  Space: [""],
  PrintScreen: ["prt sc"],
  ScrollLock: ["scr lk"],
  Pause: ["pause"],
  Insert: ["ins", "help"],
  Home: ["home"],
  PageUp: ["pg up"],
  Delete: ["del", "⌦"],
  End: ["end"],
  PageDown: ["pg dn"],
  ArrowUp: ["↑"],
  ArrowDown: ["↓"],
  ArrowLeft: ["←"],
  ArrowRight: ["→"],
  NumLock: ["num", "clear"],
  NumpadDivide: ["/"],
  NumpadMultiply: ["*"],
  NumpadSubtract: ["−"],
  NumpadAdd: ["+"],
  NumpadEnter: ["enter"],
  NumpadDecimal: ["."],
  NumpadEqual: ["="],
};

export type KeyLabel = { main: string; shift?: string; named: boolean };

export function labelFor(
  code: string,
  layout: LabelLayout,
  os: OS,
  /** bảng lấy từ navigator.keyboard.getLayoutMap(), nếu có */
  system: Map<string, string> | null,
): KeyLabel {
  const named = NAMED[code];
  if (named) return { main: (os === "mac" && named[1]) || named[0], named: true };
  if (/^F\d+$/.test(code)) return { main: code, named: true };
  const np = /^Numpad(\d)$/.exec(code);
  if (np) return { main: np[1], named: false };

  let ch: string | undefined;
  if (layout === "system") ch = system?.get(code) ?? MAPS.qwerty[code];
  else ch = MAPS[layout][code];
  if (ch === undefined) return { main: code, named: true };

  // ß viết hoa thành "SS" -> chỉ viết hoa khi vẫn còn là một ký tự
  const isLetter =
    ch.toLowerCase() !== ch.toUpperCase() && [...ch.toUpperCase()].length === 1;
  const shift =
    layout === "qwerty" && !isLetter ? SHIFT_MAP[code] : undefined;
  return { main: isLetter ? ch.toUpperCase() : ch, shift, named: false };
}

type KeyboardAPI = {
  getLayoutMap?: () => Promise<Map<string, string>>;
  lock?: (codes?: string[]) => Promise<void>;
  unlock?: () => void;
};

/** navigator.keyboard chỉ có trên Chromium. */
export const keyboardApi = (): KeyboardAPI | undefined =>
  (navigator as Navigator & { keyboard?: KeyboardAPI }).keyboard;
