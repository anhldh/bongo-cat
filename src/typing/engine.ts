import { generateWords, type Lang } from "./words";

/**
 * Lõi bài test gõ phím, viết thuần TS, không dính React.
 *
 * React đọc qua useSyncExternalStore: mỗi thay đổi tạo một snapshot mới, còn
 * bộ đếm phím / timer nằm trong instance cho khỏi re-render vô ích.
 */

export type Mode = "time" | "words";

export type Config = {
  mode: Mode;
  /** giây, cho chế độ thời gian */
  time: number;
  /** số từ, cho chế độ số từ */
  words: number;
  lang: Lang;
  punctuation: boolean;
  numbers: boolean;
};

export const TIME_OPTIONS = [15, 30, 60, 120] as const;
export const WORD_OPTIONS = [10, 25, 50, 100] as const;

export const DEFAULT_CONFIG: Config = {
  mode: "time",
  time: 30,
  words: 25,
  lang: "en",
  punctuation: false,
  numbers: false,
};

/** Một điểm trên biểu đồ, mỗi giây một điểm. */
export type Sample = {
  /** giây thứ mấy (giây cuối có thể lẻ) */
  t: number;
  /** wpm tính dồn từ đầu tới giây này */
  wpm: number;
  /** raw riêng trong giây này (burst) */
  raw: number;
  /** số phím sai trong giây này */
  errors: number;
};

export type Result = {
  wpm: number;
  raw: number;
  acc: number;
  consistency: number;
  /** giây */
  duration: number;
  chars: { correct: number; incorrect: number; extra: number; missed: number };
  samples: Sample[];
  config: Config;
};

export type Phase = "idle" | "running" | "done";

export type Snapshot = Readonly<{
  /** tăng mỗi lần làm lại, để UI biết mà reset hiệu ứng */
  id: number;
  words: readonly string[];
  /** các từ đã chốt (bấm space), typed[i] ứng với words[i] */
  typed: readonly string[];
  /** từ đang gõ dở */
  input: string;
  phase: Phase;
  /** số giây trọn đã trôi */
  elapsed: number;
  liveWpm: number;
  liveAcc: number;
  result: Result | null;
}>;

/** gõ thừa quá chừng này ký tự thì bỏ, khỏi tràn dòng */
const MAX_EXTRA = 12;
/** chế độ thời gian: còn ít hơn chừng này từ phía trước thì sinh thêm */
const BUFFER = 40;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Độ ổn định kiểu monkeytype: hệ số biến thiên -> 0..100 qua hàm kogasa. */
function consistencyOf(values: number[]) {
  if (values.length < 2) return 100;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const sd = Math.sqrt(
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length,
  );
  const cov = sd / mean;
  return Math.max(
    0,
    100 * (1 - Math.tanh(cov + cov ** 3 / 3 + cov ** 5 / 5)),
  );
}

export class TypingEngine {
  private config: Config;
  private snap: Snapshot;
  private listeners = new Set<() => void>();

  private startedAt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private correctKeys = 0;
  private wrongKeys = 0;
  /** phím trong giây hiện tại, để vẽ raw + lỗi theo từng giây */
  private bucketKeys = 0;
  private bucketErrors = 0;
  private samples: Sample[] = [];
  private finishListener: ((r: Result) => void) | null = null;

  constructor(config: Config) {
    this.config = config;
    this.snap = this.fresh(this.makeWords(), 0);
  }

  /* ---------- store ---------- */

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = () => this.snap;

  private set(patch: Partial<Snapshot>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((fn) => fn());
  }

  /* ---------- vòng đời ---------- */

  /** gọi một lần mỗi khi xong bài (để lưu kỷ lục...) */
  onFinish(fn: ((r: Result) => void) | null) {
    this.finishListener = fn;
  }

  getConfig() {
    return this.config;
  }

  setConfig(config: Config) {
    this.config = config;
    this.restart();
  }

  /** repeat = giữ nguyên đề cũ */
  restart(repeat = false) {
    this.stopTimer();
    const words = repeat ? [...this.snap.words] : this.makeWords();
    this.correctKeys = this.wrongKeys = 0;
    this.bucketKeys = this.bucketErrors = 0;
    this.samples = [];
    this.snap = this.fresh(words, this.snap.id + 1);
    this.listeners.forEach((fn) => fn());
  }

  /** gỡ component thì dừng timer; listener tự huỷ qua useSyncExternalStore */
  dispose() {
    this.stopTimer();
  }

  private fresh(words: string[], id: number): Snapshot {
    return {
      id,
      words,
      typed: [],
      input: "",
      phase: "idle",
      elapsed: 0,
      liveWpm: 0,
      liveAcc: 100,
      result: null,
    };
  }

  private makeWords() {
    const c = this.config;
    return c.mode === "words"
      ? generateWords(c.words, c, [], true)
      : generateWords(100, c);
  }

  private start() {
    this.startedAt = performance.now();
    this.snap = { ...this.snap, phase: "running" };
    this.schedule(1);
  }

  /** hẹn theo mốc tuyệt đối từ lúc bắt đầu, khỏi trôi giờ như setInterval */
  private schedule(n: number) {
    const delay = this.startedAt + n * 1000 - performance.now();
    this.timer = setTimeout(() => this.onSecond(n), Math.max(0, delay));
  }

  private stopTimer() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  private onSecond(n: number) {
    this.pushSample(n, 1);
    if (this.config.mode === "time" && n >= this.config.time) {
      this.finish(n);
      return;
    }
    this.set({
      elapsed: n,
      liveWpm: this.samples.at(-1)!.wpm,
      liveAcc: this.accuracy(),
    });
    this.schedule(n + 1);
  }

  private pushSample(t: number, dt: number) {
    const minutes = t / 60;
    this.samples.push({
      t: round2(t),
      wpm: minutes > 0 ? this.correctChars() / 5 / minutes : 0,
      raw: dt > 0 ? this.bucketKeys / 5 / (dt / 60) : 0,
      errors: this.bucketErrors,
    });
    this.bucketKeys = this.bucketErrors = 0;
  }

  private finish(duration?: number) {
    this.stopTimer();
    let dur = duration ?? (performance.now() - this.startedAt) / 1000;
    if (duration === undefined) {
      // giây lẻ cuối (chế độ số từ dừng giữa chừng)
      const whole = Math.floor(dur);
      const frac = dur - whole;
      const last = this.samples.at(-1);
      if (frac >= 0.5 || !last) {
        dur = Math.max(dur, 0.05);
        this.pushSample(dur, Math.max(frac, 0.05));
      } else {
        // giây lẻ quá ngắn: burst tính ra rất nhiễu và làm đường cong gãy ->
        // gộp vào điểm cuối thay vì vẽ thêm điểm
        last.errors += this.bucketErrors;
        last.wpm = this.correctChars() / 5 / (dur / 60);
        this.bucketKeys = this.bucketErrors = 0;
      }
    }

    const { words, typed, input } = this.snap;
    const minutes = dur / 60;
    const includeInput = this.config.mode === "time";

    // ký tự đã gõ (kể cả sai) + dấu cách giữa các từ
    let all = typed.reduce((a, w) => a + w.length, 0) + typed.length;
    if (includeInput) all += input.length;
    else all -= 1; // từ cuối không có dấu cách theo sau

    const chars = { correct: 0, incorrect: 0, extra: 0, missed: 0 };
    const tally = (t: string, w: string, partial: boolean) => {
      const n = Math.max(t.length, partial ? 0 : w.length);
      for (let j = 0; j < n; j++) {
        if (j >= w.length) chars.extra++;
        else if (j >= t.length) chars.missed++;
        else if (t[j] === w[j]) chars.correct++;
        else chars.incorrect++;
      }
    };
    typed.forEach((t, i) => tally(t, words[i], false));
    if (includeInput && input) tally(input, words[typed.length], true);

    const result: Result = {
      wpm: this.correctChars() / 5 / minutes,
      raw: Math.max(0, all) / 5 / minutes,
      acc: this.accuracy(),
      consistency: consistencyOf(this.samples.map((s) => s.raw)),
      duration: round2(dur),
      chars,
      samples: this.samples,
      config: this.config,
    };
    this.set({ phase: "done", result, elapsed: Math.floor(dur) });
    this.finishListener?.(result);
  }

  /** ký tự của các từ gõ đúng + dấu cách, cộng phần đúng của từ đang gõ */
  private correctChars() {
    const { words, typed, input } = this.snap;
    let n = 0;
    typed.forEach((t, i) => {
      if (t === words[i]) n += t.length + (i < words.length - 1 ? 1 : 0);
    });
    const cur = words[typed.length];
    if (cur && input && cur.startsWith(input)) n += input.length;
    return n;
  }

  private accuracy() {
    const total = this.correctKeys + this.wrongKeys;
    return total === 0 ? 100 : (this.correctKeys / total) * 100;
  }

  private key(ok: boolean) {
    if (ok) this.correctKeys++;
    else {
      this.wrongKeys++;
      this.bucketErrors++;
    }
    this.bucketKeys++;
  }

  /* ---------- nhập liệu ---------- */

  /** Giá trị mới của ô nhập (chỉ chứa từ đang gõ). */
  input(raw: string) {
    if (this.snap.phase === "done") return;
    const value = raw.normalize("NFC");

    // bàn phím ảo / bộ gõ tiếng Việt có thể chèn luôn dấu cách vào ô nhập
    const sp = value.indexOf(" ");
    if (sp !== -1) {
      this.input(value.slice(0, sp));
      this.space();
      return;
    }

    const { words, typed, input: prev } = this.snap;
    const target = words[typed.length];
    if (value === prev) return;
    if (value.length > target.length + MAX_EXTRA) return;

    if (this.snap.phase === "idle") {
      if (!value) return;
      this.start();
    }

    // chỉ chấm phần mới thêm vào. Bộ gõ đổi "a" thành "â" -> chấm lại ký tự đó.
    if (!prev.startsWith(value)) {
      let p = 0;
      while (p < prev.length && p < value.length && prev[p] === value[p]) p++;
      for (let i = p; i < value.length; i++) this.key(value[i] === target[i]);
    }

    this.set({ input: value });

    // chế độ số từ: gõ đúng hết từ cuối là xong luôn, không cần space
    if (
      this.config.mode === "words" &&
      typed.length === words.length - 1 &&
      value === target
    ) {
      this.set({ typed: [...typed, value], input: "" });
      this.finish();
    }
  }

  space() {
    const { words, typed, input, phase } = this.snap;
    if (phase !== "running" || !input) return;
    const target = words[typed.length];
    // space sớm = bỏ sót chữ -> tính là một lần sai
    this.key(input.length >= target.length);

    const nextTyped = [...typed, input];
    if (this.config.mode === "words" && nextTyped.length === words.length) {
      this.set({ typed: nextTyped, input: "" });
      this.finish();
      return;
    }

    let nextWords = words;
    if (this.config.mode === "time" && words.length - nextTyped.length < BUFFER) {
      nextWords = [...words, ...generateWords(60, this.config, words)];
    }
    this.set({ typed: nextTyped, input: "", words: nextWords });
  }

  /**
   * Backspace khi ô nhập trống: quay lại từ trước nếu từ đó gõ sai (từ đúng
   * thì khoá, giống monkeytype). Trả về true nếu đã xử lý.
   */
  backspaceAtStart(wholeWord: boolean) {
    const { words, typed, input, phase } = this.snap;
    if (phase !== "running" || input !== "" || typed.length === 0) return false;
    const i = typed.length - 1;
    if (typed[i] === words[i]) return false;
    this.set({ typed: typed.slice(0, -1), input: wholeWord ? "" : typed[i] });
    return true;
  }
}
