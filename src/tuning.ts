/**
 * Các số canh tay bằng mắt. Tách riêng để chỉnh sống bằng leva rồi chép ngược
 * vào đây. Chỉnh xong thì xoá useTuning.ts và gỡ leva, file này ở lại.
 *
 * Toạ độ tính trong khung 612x354.
 */

export type Tuning = {
  /** rotate xoay quanh tâm ảnh, không ảnh hưởng đường cắt mép bàn. */
  umaru: { x: number; y: number; w: number; h: number; rotate: number };
  /** Sprite vốn đã đứng dọc, ngón chĩa lên — rotate 0 là giữ nguyên như up.png cũ. */
  handKb: { x: number; y: number; w: number; h: number; rotate: number };
  handMouse: {
    /** Lòng bàn tay trong sprite 95x68 — điểm này ghim vào con chuột. */
    gripX: number;
    gripY: number;
    /** Đuôi tay áo — hướng từ grip tới đây là trục kéo dãn. */
    tipX: number;
    tipY: number;
    thickness: number;
    /** Chặn dưới hệ số kéo dãn, tránh bóp dẹp khi chuột sát vai. */
    minStretch: number;
  };
  /** Đuôi tay áo dừng ở đây. Tay chuột vẽ đè lên mặt nên điểm này phải nằm
   *  lọt trong bóng đầu, không thì thấy mép cắt. */
  shoulder: { x: number; y: number };
  /**
   * Vùng con chuột chạy, suy từ tứ giác lót chuột trong BongoCat.tsx.
   * range thu nhỏ quanh tâm (1 = full lót chuột), rồi dời bằng offset.
   * Thu càng nhỏ thì cánh tay càng đỡ phải kéo dãn.
   */
  pad: { range: number; offsetX: number; offsetY: number };
};

export const DEFAULT_TUNING: Tuning = {
  umaru: { x: 99, y: 29, w: 454, h: 197, rotate: 8 },
  handKb: { x: 334, y: 112, w: 124, h: 115, rotate: 0 },
  // handMouse: {
  //   gripX: 0,
  //   gripY: 68,
  //   tipX: 81,
  //   tipY: 43,
  //   thickness: 0.7,
  //   minStretch: 0.7,
  // },
  // shoulder: { x: 216, y: 207 },
  // pad: { range: 0.49, offsetX: 30, offsetY: -9 },
  handMouse: {
    gripX: 26,
    gripY: 55,
    tipX: 81,
    tipY: 43,
    thickness: 0.7,
    minStretch: 0.7,
  },
  shoulder: { x: 216, y: 207 },
  pad: { range: 0.49, offsetX: 45, offsetY: -16 },
};
