import clsx from "clsx";
import { AtSign, Clock, Hash, Languages, Type } from "lucide-react";
import { Bar, Opt, Sep } from "../ui/Segmented";
import {
  TIME_OPTIONS,
  WORD_OPTIONS,
  type Config,
} from "../../typing/engine";
import { LANGS } from "../../typing/words";

type Props = {
  config: Config;
  onChange: (c: Config) => void;
  /** đang gõ -> mờ đi cho đỡ rối mắt */
  dimmed: boolean;
};

export function ConfigBar({ config, onChange, dimmed }: Props) {
  const set = (patch: Partial<Config>) => onChange({ ...config, ...patch });
  const amounts = config.mode === "time" ? TIME_OPTIONS : WORD_OPTIONS;
  const amount = config.mode === "time" ? config.time : config.words;

  return (
    <Bar
      className={clsx(
        "transition-opacity duration-300",
        dimmed && "pointer-events-none opacity-0",
      )}
    >
      <Opt
        active={config.punctuation}
        onClick={() => set({ punctuation: !config.punctuation })}
      >
        <AtSign size={14} /> dấu câu
      </Opt>
      <Opt
        active={config.numbers}
        onClick={() => set({ numbers: !config.numbers })}
      >
        <Hash size={14} /> số
      </Opt>
      <Sep />
      <Opt
        layoutGroup="cfg-mode"
        active={config.mode === "time"}
        onClick={() => set({ mode: "time" })}
      >
        <Clock size={14} /> thời gian
      </Opt>
      <Opt
        layoutGroup="cfg-mode"
        active={config.mode === "words"}
        onClick={() => set({ mode: "words" })}
      >
        <Type size={14} /> số từ
      </Opt>
      <Sep />
      {amounts.map((n) => (
        <Opt
          key={`${config.mode}-${n}`}
          layoutGroup="cfg-amount"
          active={amount === n}
          onClick={() =>
            set(config.mode === "time" ? { time: n } : { words: n })
          }
        >
          {n}
        </Opt>
      ))}
      <Sep />
      <Languages size={14} className="ml-1.5 text-sub" aria-hidden />
      {LANGS.map((l) => (
        <Opt
          key={l.id}
          layoutGroup="cfg-lang"
          active={config.lang === l.id}
          onClick={() => set({ lang: l.id })}
        >
          {l.label}
        </Opt>
      ))}
    </Bar>
  );
}
