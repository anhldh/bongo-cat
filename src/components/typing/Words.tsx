import { memo, useLayoutEffect, useRef } from "react";
import clsx from "clsx";

type WordProps = {
  word: string;
  /** undefined = chưa tới lượt */
  typed: string | undefined;
  active: boolean;
};

/**
 * Một từ. Không được `position` gì cả: caret đo offsetLeft/Top của từng chữ
 * theo khung ngoài, có position là toạ độ bị tính theo từ.
 *
 * memo để mỗi phím chỉ vẽ lại đúng từ đang gõ, vài trăm từ còn lại
 * đứng im.
 */
const Word = memo(function Word({ word, typed, active }: WordProps) {
  const done = typed !== undefined && !active;
  const wrong = done && typed !== word;
  const t = typed ?? "";
  const extra = t.length > word.length ? t.slice(word.length) : "";

  return (
    <span
      className={clsx(
        "whitespace-nowrap border-b-2 border-transparent transition-colors duration-150",
        wrong && "border-err/70",
      )}
    >
      {[...word].map((ch, i) => (
        <span
          key={i}
          className={clsx(
            i >= t.length
              ? "text-sub"
              : t[i] === ch
                ? "text-text"
                : "text-err",
          )}
        >
          {ch}
        </span>
      ))}
      {[...extra].map((ch, i) => (
        <span key={`x${i}`} className="text-err-x">
          {ch}
        </span>
      ))}
    </span>
  );
});

/** Đặt caret + cuộn dòng theo vị trí thật của chữ. snap = không trượt. */
function place(
  inner: HTMLElement | null,
  list: HTMLElement | null,
  caret: HTMLElement | null,
  index: number,
  inputLen: number,
  snap: boolean,
) {
  if (!inner || !list || !caret) return;

  const wordEl = list.children[index] as HTMLElement | undefined;
  if (!wordEl) return;

  // --- caret: đứng trước chữ kế tiếp, hoặc sau chữ cuối nếu gõ hết/thừa
  const letters = wordEl.children;
  const atEnd = inputLen >= letters.length;
  const l = letters[atEnd ? letters.length - 1 : inputLen] as HTMLElement;
  const x = l.offsetLeft + (atEnd ? l.offsetWidth : 0);
  const y = l.offsetTop + (l.offsetHeight - caret.offsetHeight) / 2;
  caret.style.transition = snap ? "none" : "";
  caret.style.transform = `translate(${x - 1}px, ${y}px)`;

  // --- cuộn dòng: giữ từ đang gõ ở dòng 2, dòng trên cùng trượt mất
  const tops: number[] = [];
  for (let i = 0; i <= index; i++) {
    const top = (list.children[i] as HTMLElement).offsetTop;
    if (tops.at(-1) !== top) tops.push(top);
  }
  const line = tops.length - 1;
  const offset = line >= 2 ? tops[line - 1] - tops[0] : 0;
  inner.style.transition = snap ? "none" : "";
  inner.style.transform = `translateY(${-offset}px)`;
}

type Props = {
  words: readonly string[];
  typed: readonly string[];
  input: string;
  focused: boolean;
  /** đổi là caret nhảy thẳng về đầu, không trượt */
  testId: number;
};

/**
 * Khung 3 dòng chữ. Dòng cuộn và caret đều chỉnh thẳng DOM trong layout
 * effect (không qua state) để không phải vẽ lại cả khung mỗi phím.
 */
export function Words({ words, typed, input, focused, testId }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const lastTest = useRef(testId);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const index = typed.length;

  // vị trí mới nhất, để resize / font tải xong đo lại đúng chỗ
  const pos = useRef({ index, inputLen: input.length });

  useLayoutEffect(() => {
    pos.current = { index, inputLen: input.length };
    const jump = lastTest.current !== testId;
    lastTest.current = testId;
    place(innerRef.current, listRef.current, caretRef.current, index, input.length, jump);

    // đang gõ thì caret đứng yên, dừng tay nửa giây mới nhấp nháy lại
    const caret = caretRef.current;
    if (!caret) return;
    caret.classList.remove("caret-blink");
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(
      () => caret.classList.add("caret-blink"),
      500,
    );
  });

  useLayoutEffect(() => {
    const remeasure = () =>
      place(
        innerRef.current,
        listRef.current,
        caretRef.current,
        pos.current.index,
        pos.current.inputLen,
        true,
      );
    const ro = new ResizeObserver(remeasure);
    if (listRef.current) ro.observe(listRef.current);
    void document.fonts?.ready.then(remeasure);
    return () => {
      ro.disconnect();
      clearTimeout(idleTimer.current);
    };
  }, []);

  return (
    <div
      className="relative h-[4.95em] overflow-hidden font-mono text-[1.65rem] leading-[1.5] sm:text-[1.85rem]"
      aria-hidden
    >
      <div
        ref={innerRef}
        className="relative transition-transform duration-200 ease-out will-change-transform"
      >
        <div
          ref={listRef}
          className="flex flex-wrap gap-x-[0.55em] gap-y-[0.15em]"
        >
          {words.map((w, i) => (
            <Word
              key={i}
              word={w}
              typed={i < index ? typed[i] : i === index ? input : undefined}
              active={i === index}
            />
          ))}
        </div>
        <div
          ref={caretRef}
          className={clsx(
            "pointer-events-none absolute left-0 top-0 h-[1.15em] w-[3px] rounded-full bg-main",
            "transition-[transform,opacity] duration-[85ms] ease-out",
            !focused && "opacity-0",
          )}
        />
      </div>
    </div>
  );
}
