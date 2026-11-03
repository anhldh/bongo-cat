import { useEffect, type CSSProperties } from "react";
import { SPRITE_COUNT } from "../../keymap";
import type { MouseState } from "../../hooks/useMouse";
import { DEFAULT_TUNING, type Tuning } from "../../tuning";

const BASE = "/standard";

/* --- Hình học tay phải, toạ độ trong khung 612x354 ------------------ */

/** Vùng tâm chuột chạy trên lót chuột: TL, TR, BR, BL. */
const PAD = [
  [55, 203],
  [193, 228],
  [168, 264],
  [28, 239],
] as const;

/** Điểm cầm trên sprite chuột 104x103. */
const GRIP = [58, 44] as const;

const MOUSE_W = 104;
const MOUSE_H = 103;

/** Kích thước gốc của sprite tay cầm chuột. */
const HM_W = 95;
const HM_H = 68;

/**
 * Mép bàn trong mousebg.png, đo bằng cách dò cột alpha: y = 0.18x + 149.
 * Umaru bị cắt theo đường này nên kéo xuống là chìm sau bàn, nhưng vẫn vẽ sau
 * cánh tay nên vẫn che được đầu mút tay áo.
 */
const DESK_EDGE = { slope: 0.18, intercept: 149 };
const deskY = (x: number) => DESK_EDGE.slope * x + DESK_EDGE.intercept;
const ABOVE_DESK = `0,-500 612,-500 612,${deskY(612)} 0,${deskY(0)}`;

/**
 * Nội suy song tuyến tính trong tứ giác lót chuột, sau khi thu hẹp quanh tâm
 * theo `pad.range` rồi dời theo offset.
 */
function padPoint(u: number, v: number, pad: Tuning["pad"]) {
  const su = 0.5 + (u - 0.5) * pad.range;
  const sv = 0.5 + (v - 0.5) * pad.range;
  const [tl, tr, br, bl] = PAD;
  const tx = tl[0] + (tr[0] - tl[0]) * su;
  const ty = tl[1] + (tr[1] - tl[1]) * su;
  const bx = bl[0] + (br[0] - bl[0]) * su;
  const by = bl[1] + (br[1] - bl[1]) * su;
  return [
    tx + (bx - tx) * sv + pad.offsetX,
    ty + (by - ty) * sv + pad.offsetY,
  ] as const;
}

type Props = {
  /** Sprite của các phím đang nhấn (cũ -> mới). */
  pressed: number[];
  /** Sprite tay: phím vừa gõ, hoặc null khi rảnh tay. */
  hand: number | null;
  mouse: MouseState;
  /** Số canh tay. Bỏ trống thì dùng mặc định trong tuning.ts. */
  tuning?: Tuning;
  className?: string;
  style?: CSSProperties;
};

/** Mọi layer đều là ảnh 612x354 đã căn sẵn -> chỉ cần chồng khít lên nhau. */
const layer: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

export function BongoCat({
  pressed,
  hand,
  mouse,
  tuning = DEFAULT_TUNING,
  className,
  style,
}: Props) {
  const { umaru, handKb, handMouse, shoulder, pad } = tuning;

  useEffect(() => {
    // 100 ảnh (~800KB). Không nạp trước thì lần đầu gõ mỗi phím bị hụt 1 frame.
    for (let i = 0; i < SPRITE_COUNT; i++) {
      new Image().src = `${BASE}/hand/${i}.png`;
      new Image().src = `${BASE}/keyboard/${i}.png`;
    }
    new Image().src = `${BASE}/mouse_left.png`;
    new Image().src = `${BASE}/mouse_right.png`;
  }, []);

  const [mx, my] = padPoint(mouse.u, mouse.v, pad);

  // hướng và độ dài gốc của trục tay áo trong sprite
  const armDx = handMouse.tipX - handMouse.gripX;
  const armDy = handMouse.tipY - handMouse.gripY;
  const armLen = Math.hypot(armDx, armDy) || 1;
  const armBaseAngle = (Math.atan2(armDy, armDx) * 180) / Math.PI;

  // xoay tay áo về phía vai, rồi kéo dài dọc trục tay cho vừa khoảng cách
  const armAngle =
    (Math.atan2(shoulder.y - my, shoulder.x - mx) * 180) / Math.PI;
  const armStretch = Math.max(
    Math.hypot(shoulder.x - mx, shoulder.y - my) / armLen,
    handMouse.minStretch,
  );

  return (
    <div
      className={className}
      style={{ position: "relative", aspectRatio: "612 / 354", ...style }}
      role="img"
      aria-label={hand === null ? "Umaru đang chờ" : "Umaru đang gõ phím"}
    >
      {/* bàn, bàn phím, lót chuột */}
      <img src={`${BASE}/mousebg.png`} alt="" style={layer} />

      {/* highlight phím đang nhấn */}
      {pressed.map((i) => (
        <img key={i} src={`${BASE}/keyboard/${i}.png`} alt="" style={layer} />
      ))}

      {/* Thứ tự: chuột -> đầu -> tay chuột -> tay bàn phím. Hai cái tay nằm
          trên cùng nên luôn đè lên mặt. */}
      <svg viewBox="0 0 612 354" style={layer}>
        <image
          href={`${BASE}/mouse.png`}
          x={mx - GRIP[0]}
          y={my - GRIP[1]}
          width={MOUSE_W}
          height={MOUSE_H}
        />
        {mouse.button && (
          <image
            href={`${BASE}/mouse_${mouse.button}.png`}
            x={mx - GRIP[0]}
            y={my - GRIP[1]}
            width={MOUSE_W}
            height={MOUSE_H}
          />
        )}
        <clipPath id="above-desk">
          <polygon points={ABOVE_DESK} />
        </clipPath>
        {/* clip ở <g> ngoài, rotate ở <image> trong. Đặt chung một thẻ thì
            đường cắt xoay theo ảnh, mép bàn sẽ nghiêng lung tung. */}
        <g clipPath="url(#above-desk)">
          <image
            href={`${BASE}/umaru/umaru.png`}
            x={umaru.x}
            y={umaru.y}
            width={umaru.w}
            height={umaru.h}
            transform={`rotate(${umaru.rotate} ${umaru.x + umaru.w / 2} ${
              umaru.y + umaru.h / 2
            })`}
          />
        </g>

        {/* Tay chuột vẽ sau đầu -> nằm đè lên mặt. Đổi lại là đuôi tay áo
            không còn chỗ giấu, phải kéo vai vào trong bóng đầu. */}
        <g
          transform={
            `translate(${mx} ${my}) rotate(${armAngle}) ` +
            `scale(${armStretch} ${handMouse.thickness}) ` +
            `rotate(${-armBaseAngle}) ` +
            `translate(${-handMouse.gripX} ${-handMouse.gripY})`
          }
        >
          <image
            href={`${BASE}/umaru/hand_mouse.png`}
            width={HM_W}
            height={HM_H}
          />
        </g>

        {/* Tay lúc rảnh: vẽ sau đầu, đứng trước mặt như up.png cũ. Cắt theo
            cùng mép bàn nên đuôi tay áo chìm xuống bàn thay vì cụt lủn. */}
        {hand === null && (
          <g clipPath="url(#above-desk)">
            <image
              href={`${BASE}/umaru/hand_keyboard.png`}
              x={handKb.x}
              y={handKb.y}
              width={handKb.w}
              height={handKb.h}
              transform={`rotate(${handKb.rotate} ${handKb.x + handKb.w / 2} ${
                handKb.y + handKb.h / 2
              })`}
            />
          </g>
        )}
      </svg>

      {/* tay gõ phím vẫn là chân mèo, vẽ sau cùng cho nổi lên trên */}
      {hand !== null && (
        <img src={`${BASE}/hand/${hand}.png`} alt="" style={layer} />
      )}
    </div>
  );
}
