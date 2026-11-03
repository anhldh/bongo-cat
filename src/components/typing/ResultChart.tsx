import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { motion } from "motion/react";
import type { Sample } from "../../typing/engine";

const H = 200;
const PAD = { top: 12, right: 34, bottom: 26, left: 38 };

/** Bước chia trục cho tròn số: 10, 20, 25, 50, 100... */
function niceMax(v: number) {
  if (v <= 0) return 10;
  const exp = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * exp >= v) return m * exp;
  return 10 * exp;
}

function linePath(pts: [number, number][]) {
  if (pts.length === 0) return "";
  if (pts.length === 1) {
    const [x, y] = pts[0];
    return `M${x - 4},${y}L${x + 4},${y}`;
  }
  // Catmull-Rom -> bezier, cho đường cong mềm như monkeytype
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    // kẹp điểm điều khiển trong đoạn [p1, p2] theo cả hai trục để đường
    // không vòng ngược hay vọt khỏi khung khi hai điểm sát nhau
    const lo = (a: number, b: number, v: number) =>
      Math.min(Math.max(v, Math.min(a, b)), Math.max(a, b));
    const c1x = lo(p1[0], p2[0], p1[0] + (p2[0] - p0[0]) * t);
    const c1y = lo(p1[1], p2[1], p1[1] + (p2[1] - p0[1]) * t);
    const c2x = lo(p1[0], p2[0], p2[0] - (p3[0] - p1[0]) * t);
    const c2y = lo(p1[1], p2[1], p2[1] - (p3[1] - p1[1]) * t);
    d += `C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function ResultChart({ samples }: { samples: Sample[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // trục X chạy từ giây đầu tiên có số liệu, không phải từ 0
  const minT = samples.length > 1 ? samples[0].t : 0;
  const maxT = Math.max(minT + 0.5, samples.at(-1)?.t ?? 1);
  const yMax = niceMax(Math.max(...samples.map((s) => Math.max(s.wpm, s.raw)), 10));
  const eMax = Math.max(1, ...samples.map((s) => s.errors));
  const iw = Math.max(0, w - PAD.left - PAD.right);
  const ih = H - PAD.top - PAD.bottom;

  const x = (t: number) => PAD.left + ((t - minT) / (maxT - minT)) * iw;
  const y = (v: number) => PAD.top + ih - (v / yMax) * ih;
  const ye = (v: number) => PAD.top + ih - (v / eMax) * ih;

  const wpmPts = samples.map((s) => [x(s.t), y(s.wpm)] as [number, number]);
  const rawPts = samples.map((s) => [x(s.t), y(s.raw)] as [number, number]);
  const wpmD = linePath(wpmPts);
  const areaD =
    wpmPts.length > 1
      ? `${wpmD}L${wpmPts.at(-1)![0]},${PAD.top + ih}L${wpmPts[0][0]},${PAD.top + ih}Z`
      : "";

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  const span = maxT - minT;
  const step = Math.max(1, Math.ceil(span / Math.max(2, Math.floor(iw / 60))));
  const xTicks: number[] = [];
  for (let t = Math.ceil(minT); t <= maxT + 1e-6; t += step) xTicks.push(t);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0;
    let bestD = Infinity;
    samples.forEach((s, i) => {
      const d = Math.abs(x(s.t) - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setHover(best);
  };

  const hs = hover !== null ? samples[hover] : null;

  return (
    <div ref={boxRef} className="relative w-full select-none">
      {w > 0 && (
        <svg
          width={w}
          height={H}
          className="block overflow-visible"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="wpm-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--c-main)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--c-main)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* lưới + trục */}
          {ticks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={PAD.left + iw}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--c-line)"
                strokeDasharray={v === 0 ? undefined : "3 5"}
              />
              <text
                x={PAD.left - 8}
                y={y(v)}
                dy="0.32em"
                textAnchor="end"
                className="fill-sub font-mono text-[10px]"
              >
                {Math.round(v)}
              </text>
            </g>
          ))}
          {[0, eMax].map((v) => (
            <text
              key={`e${v}`}
              x={PAD.left + iw + 8}
              y={ye(v)}
              dy="0.32em"
              className="fill-err/70 font-mono text-[10px]"
            >
              {v}
            </text>
          ))}
          {xTicks.map((t) => (
            <text
              key={t}
              x={x(t)}
              y={H - 6}
              textAnchor="middle"
              className="fill-sub font-mono text-[10px]"
            >
              {t}
            </text>
          ))}

          {/* vùng tô + raw + wpm, vẽ dần cho có cảm giác */}
          <motion.path
            d={areaD}
            fill="url(#wpm-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          />
          <motion.path
            d={linePath(rawPts)}
            fill="none"
            stroke="var(--c-sub)"
            strokeWidth={1.75}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.path
            d={wpmD}
            fill="none"
            stroke="var(--c-main)"
            strokeWidth={2.75}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />

          {/* lỗi: dấu x theo trục phải */}
          {samples.map((s, i) =>
            s.errors > 0 ? (
              <motion.g
                key={i}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.01 }}
                style={{ originX: `${x(s.t)}px`, originY: `${ye(s.errors)}px` }}
                stroke="var(--c-err)"
                strokeWidth={1.75}
                strokeLinecap="round"
              >
                <line
                  x1={x(s.t) - 3}
                  y1={ye(s.errors) - 3}
                  x2={x(s.t) + 3}
                  y2={ye(s.errors) + 3}
                />
                <line
                  x1={x(s.t) - 3}
                  y1={ye(s.errors) + 3}
                  x2={x(s.t) + 3}
                  y2={ye(s.errors) - 3}
                />
              </motion.g>
            ) : null,
          )}

          {/* điểm đang rê chuột */}
          {hs && (
            <g pointerEvents="none">
              <line
                x1={x(hs.t)}
                x2={x(hs.t)}
                y1={PAD.top}
                y2={PAD.top + ih}
                stroke="var(--c-sub)"
                strokeOpacity={0.5}
              />
              <circle cx={x(hs.t)} cy={y(hs.raw)} r={3.5} fill="var(--c-sub)" />
              <circle
                cx={x(hs.t)}
                cy={y(hs.wpm)}
                r={4.5}
                fill="var(--c-main)"
                stroke="var(--c-bg)"
                strokeWidth={2}
              />
            </g>
          )}
          {/* vùng bắt chuột phủ kín khung */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={iw}
            height={ih}
            fill="transparent"
          />
        </svg>
      )}

      {hs && (
        <div
          className="pointer-events-none absolute top-1 z-10 min-w-28 rounded-lg bg-panel px-3 py-2 font-mono text-xs shadow-lg ring-1 ring-line"
          style={{
            left: Math.min(Math.max(x(hs.t) + 12, 0), Math.max(0, w - 130)),
          }}
        >
          <div className="mb-1 text-sub">giây {hs.t}</div>
          <Row color="var(--c-main)" label="wpm" value={Math.round(hs.wpm)} />
          <Row color="var(--c-sub)" label="raw" value={Math.round(hs.raw)} />
          <Row color="var(--c-err)" label="lỗi" value={hs.errors} />
        </div>
      )}
    </div>
  );
}

function Row({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-2 rounded-full" style={{ background: color }} />
      <span className="text-sub">{label}</span>
      <span className="ml-auto text-text">{value}</span>
    </div>
  );
}
