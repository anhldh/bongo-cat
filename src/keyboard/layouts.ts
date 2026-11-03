/**
 * Sơ đồ bàn phím vật lý, đơn vị là "u" (1u = bề ngang một phím chữ).
 *
 * Mọi phím đều gắn với KeyboardEvent.code, là vị trí vật lý nên không đổi theo
 * layout gõ (QWERTY/AZERTY...). Phần nhãn in trên phím nằm riêng ở labels.ts.
 */

export type Size = "100" | "tkl" | "75" | "65" | "60";
export type Standard = "ansi" | "iso";
export type OS = "win" | "mac";

export const SIZES: { id: Size; label: string; title: string }[] = [
  { id: "100", label: "100%", title: "full-size, có bàn số" },
  { id: "tkl", label: "TKL", title: "80%, bỏ bàn số" },
  { id: "75", label: "75%", title: "gọn, vẫn có hàng F" },
  { id: "65", label: "65%", title: "bỏ hàng F, còn phím mũi tên" },
  { id: "60", label: "60%", title: "chỉ khối chính" },
];

export type KeyDef = {
  /** duy nhất trong sơ đồ (Enter ISO có hai mảnh cùng code) */
  id: string;
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** mảnh trên / dưới của phím Enter hình chữ L (ISO) */
  part?: "iso-top" | "iso-bottom";
  /** phím không gửi gì lên máy (Fn) -> chỉ vẽ cho đủ */
  dummy?: boolean;
};

export type Layout = { keys: KeyDef[]; width: number; height: number };

/** [code, bề ngang] hoặc một số = khoảng trống */
type Item = [string, number?] | number;

function row(out: KeyDef[], y: number, x: number, items: Item[]) {
  for (const it of items) {
    if (typeof it === "number") {
      x += it;
      continue;
    }
    const [code, w = 1] = it;
    out.push({ id: code, code, x, y, w, h: 1, dummy: code === "Fn" });
    x += w;
  }
  return x;
}

const codes = (...c: string[]): Item[] => c.map((x) => [x]);
const DIGITS = codes(..."1234567890".split("").map((d) => `Digit${d}`));
const QWER = codes(..."QWERTYUIOP".split("").map((c) => `Key${c}`));
const ASDF = codes(..."ASDFGHJKL".split("").map((c) => `Key${c}`));
const ZXCV = codes(..."ZXCVBNM".split("").map((c) => `Key${c}`));
const FN = (a: number, b: number) =>
  codes(...Array.from({ length: b - a + 1 }, (_, i) => `F${a + i}`));

type MainOpts = {
  std: Standard;
  os: OS;
  /** 75/65: Shift phải ngắn lại, chừa chỗ cho mũi tên */
  compact: boolean;
  /** 65/60: Esc nằm chỗ phím ` */
  escInNumberRow: boolean;
};

/** Khối chính 15u, 5 hàng, bắt đầu từ y0. */
function mainBlock(out: KeyDef[], y0: number, o: MainOpts) {
  row(out, y0, 0, [
    [o.escInNumberRow ? "Escape" : "Backquote"],
    ...DIGITS,
    ["Minus"],
    ["Equal"],
    ["Backspace", 2],
  ]);

  if (o.std === "ansi") {
    row(out, y0 + 1, 0, [
      ["Tab", 1.5],
      ...QWER,
      ["BracketLeft"],
      ["BracketRight"],
      ["Backslash", 1.5],
    ]);
    row(out, y0 + 2, 0, [
      ["CapsLock", 1.75],
      ...ASDF,
      ["Semicolon"],
      ["Quote"],
      ["Enter", 2.25],
    ]);
  } else {
    row(out, y0 + 1, 0, [
      ["Tab", 1.5],
      ...QWER,
      ["BracketLeft"],
      ["BracketRight"],
    ]);
    row(out, y0 + 2, 0, [
      ["CapsLock", 1.75],
      ...ASDF,
      ["Semicolon"],
      ["Quote"],
      ["Backslash"],
    ]);
    // Enter chữ L: mảnh dưới cao 2 hàng vẽ trước, mảnh trên rộng hơn đè lên
    out.push(
      { id: "Enter-b", code: "Enter", x: 13.75, y: y0 + 1, w: 1.25, h: 2, part: "iso-bottom" },
      { id: "Enter", code: "Enter", x: 13.5, y: y0 + 1, w: 1.5, h: 1, part: "iso-top" },
    );
  }

  const shiftR = o.compact ? 1.75 : 2.75;
  row(out, y0 + 3, 0, [
    ...(o.std === "ansi"
      ? ([["ShiftLeft", 2.25]] as Item[])
      : ([["ShiftLeft", 1.25], ["IntlBackslash"]] as Item[])),
    ...ZXCV,
    ["Comma"],
    ["Period"],
    ["Slash"],
    ["ShiftRight", shiftR],
  ]);

  const left: Item[] =
    o.os === "win"
      ? [["ControlLeft", 1.25], ["MetaLeft", 1.25], ["AltLeft", 1.25]]
      : [["ControlLeft", 1.25], ["AltLeft", 1.25], ["MetaLeft", 1.25]];
  const right: Item[] = o.compact
    ? o.os === "win"
      ? [["AltRight"], ["ContextMenu"], ["ControlRight"]]
      : [["MetaRight"], ["AltRight"], ["ControlRight"]]
    : o.os === "win"
      ? [["AltRight", 1.25], ["MetaRight", 1.25], ["ContextMenu", 1.25], ["ControlRight", 1.25]]
      : [["MetaRight", 1.25], ["AltRight", 1.25], ["Fn", 1.25], ["ControlRight", 1.25]];
  row(out, y0 + 4, 0, [...left, ["Space", 6.25], ...right]);
}

/** Hàng F kiểu full-size / TKL: có khe giữa các cụm 4 phím. */
function fRowSpaced(out: KeyDef[]) {
  row(out, 0, 0, [["Escape"], 1, ...FN(1, 4), 0.5, ...FN(5, 8), 0.5, ...FN(9, 12)]);
}

function navCluster(out: KeyDef[], y0: number, os: OS) {
  const x = 15.25;
  row(out, 0, x, os === "win"
    ? codes("PrintScreen", "ScrollLock", "Pause")
    : codes("F13", "F14", "F15"));
  row(out, y0, x, codes("Insert", "Home", "PageUp"));
  row(out, y0 + 1, x, codes("Delete", "End", "PageDown"));
  row(out, y0 + 3, x + 1, codes("ArrowUp"));
  row(out, y0 + 4, x, codes("ArrowLeft", "ArrowDown", "ArrowRight"));
}

function numpad(out: KeyDef[], y0: number, os: OS) {
  const x = 18.5;
  if (os === "win") {
    row(out, y0, x, codes("NumLock", "NumpadDivide", "NumpadMultiply", "NumpadSubtract"));
    row(out, y0 + 1, x, codes("Numpad7", "Numpad8", "Numpad9"));
    out.push({ id: "NumpadAdd", code: "NumpadAdd", x: x + 3, y: y0 + 1, w: 1, h: 2 });
  } else {
    // bàn số Apple: clear = / * ở trên, - và + tách riêng bên phải
    row(out, y0, x, codes("NumLock", "NumpadEqual", "NumpadDivide", "NumpadMultiply"));
    row(out, y0 + 1, x, codes("Numpad7", "Numpad8", "Numpad9", "NumpadSubtract"));
    row(out, y0 + 2, x + 3, codes("NumpadAdd"));
  }
  row(out, y0 + 2, x, codes("Numpad4", "Numpad5", "Numpad6"));
  row(out, y0 + 3, x, codes("Numpad1", "Numpad2", "Numpad3"));
  out.push({ id: "NumpadEnter", code: "NumpadEnter", x: x + 3, y: y0 + 3, w: 1, h: 2 });
  row(out, y0 + 4, x, [["Numpad0", 2], ["NumpadDecimal"]]);
}

export function buildLayout(size: Size, std: Standard, os: OS): Layout {
  const keys: KeyDef[] = [];
  const F_GAP = 1.25; // hàng F cao 1u + khe 0.25u

  switch (size) {
    case "100":
    case "tkl":
      fRowSpaced(keys);
      mainBlock(keys, F_GAP, { std, os, compact: false, escInNumberRow: false });
      navCluster(keys, F_GAP, os);
      if (size === "100") numpad(keys, F_GAP, os);
      return { keys, width: size === "100" ? 22.5 : 18.25, height: F_GAP + 5 };

    case "75": {
      row(keys, 0, 0, [
        ["Escape"],
        ...FN(1, 12),
        ...(os === "win"
          ? codes("PrintScreen", "Insert", "Delete")
          : codes("F13", "Insert", "Delete")),
      ]);
      const y0 = F_GAP;
      mainBlock(keys, y0, { std, os, compact: true, escInNumberRow: false });
      rightColumn(keys, y0, ["Home", "PageUp", "PageDown", "End"]);
      return { keys, width: 16, height: y0 + 5 };
    }

    case "65":
      mainBlock(keys, 0, { std, os, compact: true, escInNumberRow: true });
      rightColumn(keys, 0, ["Delete", "PageUp", "PageDown", "End"]);
      return { keys, width: 16, height: 5 };

    case "60":
      mainBlock(keys, 0, { std, os, compact: false, escInNumberRow: true });
      return { keys, width: 15, height: 5 };
  }
}

/** Cột phải của 75%/65% cùng cụm mũi tên dưới đáy. */
function rightColumn(out: KeyDef[], y0: number, col: string[]) {
  col.forEach((code, i) => row(out, y0 + i, 15, [[code]]));
  row(out, y0 + 3, 14, codes("ArrowUp"));
  row(out, y0 + 4, 13, codes("ArrowLeft", "ArrowDown", "ArrowRight"));
}
