import { memo, type CSSProperties } from "react";
import clsx from "clsx";
import type { KeyDef, Layout } from "../../keyboard/layouts";
import type { KeyLabel } from "../../keyboard/labels";
import type { KeyStat } from "../../keyboard/useKeyTester";

type CapProps = {
  def: KeyDef;
  label: KeyLabel;
  width: number;
  height: number;
  pressed: boolean;
  stat: KeyStat | undefined;
};

/**
 * Một phím. Kích thước theo % khung, chữ theo --u (bề ngang 1u) nên bàn phím
 * co giãn đều theo chiều ngang.
 */
const KeyCap = memo(function KeyCap({
  def,
  label,
  width,
  height,
  pressed,
  stat,
}: CapProps) {
  const tested = !!stat;
  const chatter = (stat?.chatter ?? 0) > 0;
  // mảnh trên của Enter ISO: không có thành dưới, kẻo vạch ngang đè lên mảnh dưới
  const top = def.part === "iso-top";
  const showLabel = def.part !== "iso-bottom";

  const box: CSSProperties = {
    left: `${(def.x / width) * 100}%`,
    top: `${(def.y / height) * 100}%`,
    width: `${(def.w / width) * 100}%`,
    height: `${(def.h / height) * 100}%`,
  };

  const title = def.dummy
    ? "fn thường xử lý ngay trong bàn phím, không gửi gì lên máy"
    : stat
      ? `${def.code} · bấm ${stat.count} lần` +
        (stat.lastHold ? ` · giữ ${Math.round(stat.lastHold)}ms` : "") +
        (stat.chatter ? ` · nghi double ${stat.chatter} lần` : "")
      : `${def.code} · chưa bấm`;

  return (
    <div
      className="absolute p-[calc(var(--u)*0.055)]"
      style={{ ...box, zIndex: top ? 2 : 1 }}
      title={title}
    >
      <div
        className={clsx(
          "relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[calc(var(--u)*0.14)] leading-none",
          "transition-[background-color,color,transform,box-shadow] duration-100 ease-out",
          def.dummy
            ? "border border-dashed border-line bg-transparent text-sub/50"
            : pressed
              ? "translate-y-[calc(var(--u)*0.05)] bg-main text-bg"
              : tested
                ? // nền đặc, không dùng /15: hai mảnh Enter ISO chồng nhau sẽ đậm gấp đôi
                  "bg-[color-mix(in_srgb,var(--c-ok)_20%,var(--c-key))] text-ok"
                : "bg-key text-sub",
          !def.dummy && !top && !pressed && "shadow-[0_calc(var(--u)*0.06)_0_var(--c-key-edge)]",
          !def.dummy && !top && pressed && "shadow-[0_calc(var(--u)*0.01)_0_var(--c-key-edge)]",
          chatter && !pressed && "ring-2 ring-err ring-inset",
          top && "rounded-br-none",
        )}
      >
        {showLabel && (
          <>
            {label.shift && (
              <span className="mb-[calc(var(--u)*0.06)] text-[calc(var(--u)*0.2)] opacity-60">
                {label.shift}
              </span>
            )}
            <span
              className={clsx(
                "whitespace-nowrap",
                label.named
                  ? "text-[calc(var(--u)*0.19)] font-medium"
                  : "font-mono text-[calc(var(--u)*0.3)]",
              )}
            >
              {label.main}
            </span>
          </>
        )}
        {chatter && (
          <span className="absolute top-[12%] right-[12%] size-[calc(var(--u)*0.1)] rounded-full bg-err" />
        )}
      </div>
    </div>
  );
});

type Props = {
  layout: Layout;
  /** code -> nhãn, tính sẵn ở ngoài để KeyCap memo được */
  labels: Record<string, KeyLabel>;
  held: ReadonlySet<string>;
  stats: Record<string, KeyStat>;
};

export function KeyboardView({ layout, labels, held, stats }: Props) {
  const { keys, width, height } = layout;
  return (
    // 100% thì cần tối thiểu chừng này mới đọc nổi chữ, nhỏ hơn thì cuộn ngang
    <div className="-mx-1 overflow-x-auto px-1 pb-2">
      <div
        className="@container mx-auto rounded-2xl bg-panel p-[1.6%] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-line"
        style={{ minWidth: `${width * 34}px`, maxWidth: `${width * 64}px` }}
      >
        <div
          className="relative w-full"
          style={
            {
              aspectRatio: `${width} / ${height}`,
              "--u": `calc(100cqw / ${width})`,
            } as CSSProperties
          }
        >
          {keys.map((k) => (
            <KeyCap
              key={k.id}
              def={k}
              label={labels[k.code]}
              width={width}
              height={height}
              pressed={held.has(k.code)}
              stat={stats[k.code]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
