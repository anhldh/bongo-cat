import { useEffect } from "react";
import { button, folder, useControls } from "leva";
import { DEFAULT_TUNING, type Tuning } from "./tuning";

const d = DEFAULT_TUNING;

/** Bản mới nhất, để nút "chép vào console" đọc được. Chỉ có một bảng nên đủ. */
let latest: Tuning = DEFAULT_TUNING;
const int = (value: number, min: number, max: number) => ({
  value,
  min,
  max,
  step: 1,
});

/**
 * Giàn giáo chỉnh tay. Canh xong bấm "chép vào console", dán số vào tuning.ts,
 * rồi xoá file này cùng leva.
 */
export function useTuning(): { tuning: Tuning; freezeMouse: boolean } {
  const v = useControls({
    freezeMouse: { value: false, label: "đóng băng chuột" },
    "chép vào console": button(() =>
      console.log(JSON.stringify(latest, null, 2)),
    ),
    "Mặt Umaru": folder({
      umaruX: int(d.umaru.x, -150, 500),
      umaruY: int(d.umaru.y, -200, 300),
      umaruW: int(d.umaru.w, 40, 612),
      umaruH: int(d.umaru.h, 40, 500),
      umaruRotate: { value: d.umaru.rotate, min: -180, max: 180, step: 0.5 },
    }),
    "Tay bàn phím": folder({
      kbX: int(d.handKb.x, 0, 612),
      kbY: int(d.handKb.y, -100, 354),
      kbW: int(d.handKb.w, 5, 250),
      kbH: int(d.handKb.h, 5, 350),
      kbRotate: int(d.handKb.rotate, -180, 360),
    }),
    "Tay chuột + vai": folder({
      gripX: int(d.handMouse.gripX, 0, 95),
      gripY: int(d.handMouse.gripY, 0, 68),
      tipX: int(d.handMouse.tipX, 0, 95),
      tipY: int(d.handMouse.tipY, 0, 68),
      thickness: { value: d.handMouse.thickness, min: 0.2, max: 3, step: 0.05 },
      minStretch: {
        value: d.handMouse.minStretch,
        min: 0.1,
        max: 2,
        step: 0.05,
      },
      shoulderX: int(d.shoulder.x, 0, 612),
      shoulderY: int(d.shoulder.y, 0, 354),
    }),
    "Vùng chuột chạy": folder({
      padRange: { value: d.pad.range, min: 0, max: 1.2, step: 0.01 },
      padOffsetX: int(d.pad.offsetX, -120, 120),
      padOffsetY: int(d.pad.offsetY, -120, 120),
    }),
  });

  const tuning: Tuning = {
    umaru: {
      x: v.umaruX,
      y: v.umaruY,
      w: v.umaruW,
      h: v.umaruH,
      rotate: v.umaruRotate,
    },
    handKb: {
      x: v.kbX,
      y: v.kbY,
      w: v.kbW,
      h: v.kbH,
      rotate: v.kbRotate,
    },
    handMouse: {
      gripX: v.gripX,
      gripY: v.gripY,
      tipX: v.tipX,
      tipY: v.tipY,
      thickness: v.thickness,
      minStretch: v.minStretch,
    },
    shoulder: { x: v.shoulderX, y: v.shoulderY },
    pad: {
      range: v.padRange,
      offsetX: v.padOffsetX,
      offsetY: v.padOffsetY,
    },
  };

  useEffect(() => {
    latest = tuning;
  });

  return { tuning, freezeMouse: v.freezeMouse };
}
