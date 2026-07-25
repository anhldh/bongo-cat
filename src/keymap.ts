/**
 * KeyboardEvent.code -> chỉ số sprite trong public/standard/.
 *
 * Sinh ra từ config.json -> standard.hand (50 phần tử, là virtual-key code của
 * Windows). Index i ứng với cả hand/i.png lẫn keyboard/i.png.
 *
 * Modifier trong config chỉ có một mã chung (VK 16 = Shift) nên trái/phải cùng
 * trỏ về một sprite.
 */
export const KEY_TO_SPRITE: Record<string, number> = {
  Digit0: 0,
  Digit9: 1,
  Digit8: 2,
  Digit7: 3,
  Digit6: 4,
  Digit5: 5,
  Digit4: 6,
  Digit3: 7,
  Digit2: 8,
  Digit1: 9,
  Backquote: 10,
  KeyP: 11,
  KeyO: 12,
  KeyI: 13,
  KeyU: 14,
  KeyY: 15,
  KeyT: 16,
  KeyR: 17,
  KeyE: 18,
  KeyW: 19,
  KeyQ: 20,
  Slash: 21,
  KeyM: 22,
  KeyN: 23,
  KeyB: 24,
  KeyV: 25,
  KeyC: 26,
  KeyL: 27,
  KeyK: 28,
  KeyJ: 29,
  KeyH: 30,
  KeyG: 31,
  KeyF: 32,
  KeyA: 33,
  KeyS: 34,
  KeyD: 35,
  KeyX: 36,
  KeyZ: 37,
  F2: 38,
  Escape: 39,
  Delete: 40,
  Backspace: 41,
  Enter: 42,
  Space: 43,
  AltLeft: 44,
  AltRight: 44,
  ShiftLeft: 45,
  ShiftRight: 45,
  ControlLeft: 46,
  ControlRight: 46,
  CapsLock: 47,
  Tab: 48,
  MetaLeft: 49,
  MetaRight: 49,
};

/** Số sprite trong hand/ và keyboard/ (0..COUNT-1). */
export const SPRITE_COUNT = 50;
