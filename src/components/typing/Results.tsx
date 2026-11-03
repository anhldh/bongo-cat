import { motion, type Variants } from "motion/react";
import { ChevronRight, Crown, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import type { Result } from "../../typing/engine";
import { LANGS } from "../../typing/words";
import { ResultChart } from "./ResultChart";

type Props = {
  result: Result;
  /** kỷ lục cũ trước bài này, null nếu chưa có */
  prevBest: number | null;
  onNext: () => void;
  onRepeat: () => void;
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

function Stat({
  label,
  value,
  big,
  title,
}: {
  label: string;
  value: ReactNode;
  big?: boolean;
  title?: string;
}) {
  return (
    <motion.div variants={item} title={title}>
      <div className={big ? "text-lg text-sub" : "text-xs text-sub"}>
        {label}
      </div>
      <div
        className={
          big
            ? "font-mono text-6xl leading-none text-main tabular-nums"
            : "font-mono text-2xl leading-tight text-main tabular-nums"
        }
      >
        {value}
      </div>
    </motion.div>
  );
}

export function Results({ result, prevBest, onNext, onRepeat }: Props) {
  const r = result;
  const c = r.config;
  const isPb = prevBest === null || r.wpm > prevBest;
  const lang = LANGS.find((l) => l.id === c.lang)?.label;
  const testType = [
    c.mode === "time" ? `thời gian ${c.time}s` : `${c.words} từ`,
    lang,
    c.punctuation && "dấu câu",
    c.numbers && "số",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
        <div className="flex gap-10 md:flex-col md:gap-6">
          <div className="relative">
            <Stat
              big
              label="wpm"
              value={Math.round(r.wpm)}
              title={`${r.wpm.toFixed(2)} wpm`}
            />
            {isPb && r.wpm > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.4 }}
                className="absolute -right-8 -top-1 text-main"
                title="kỷ lục mới!"
              >
                <Crown size={22} />
              </motion.div>
            )}
          </div>
          <Stat
            big
            label="chính xác"
            value={`${Math.round(r.acc)}%`}
            title={`${r.acc.toFixed(2)}%`}
          />
        </div>
        <motion.div variants={item} className="min-w-0">
          <ResultChart samples={r.samples} />
        </motion.div>
      </div>

      <div className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
        <motion.div variants={item}>
          <div className="text-xs text-sub">kiểu bài</div>
          <div className="text-sm text-main">{testType}</div>
        </motion.div>
        <Stat label="raw" value={Math.round(r.raw)} />
        <Stat
          label="ký tự"
          title="đúng / sai / thừa / sót"
          value={`${r.chars.correct}/${r.chars.incorrect}/${r.chars.extra}/${r.chars.missed}`}
        />
        <Stat label="ổn định" value={`${Math.round(r.consistency)}%`} />
        <Stat label="thời gian" value={`${Math.round(r.duration)}s`} />
        {prevBest !== null && (
          <Stat
            label={isPb ? "kỷ lục cũ" : "kỷ lục"}
            value={Math.round(prevBest)}
          />
        )}
      </div>

      <motion.div
        variants={item}
        className="mt-10 flex items-center justify-center gap-2"
      >
        <IconBtn label="bài mới" onClick={onNext} autoFocus>
          <ChevronRight size={20} />
        </IconBtn>
        <IconBtn label="làm lại đề này" onClick={onRepeat}>
          <RotateCcw size={17} />
        </IconBtn>
      </motion.div>
    </motion.div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  autoFocus,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  autoFocus?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      autoFocus={autoFocus}
      className="grid size-11 place-items-center rounded-xl text-sub transition-colors hover:bg-panel hover:text-text"
    >
      {children}
    </button>
  );
}
