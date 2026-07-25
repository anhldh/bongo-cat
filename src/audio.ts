/**
 * Âm thanh tổng hợp bằng WebAudio, không dùng file nào.
 *
 * Tách ra khỏi useBongo vì giờ cả bàn phím lẫn chuột đều cần dùng chung
 * AudioContext và buffer noise.
 */

/** Chỉ còn dùng để đổi cao độ tiếng gõ. */
export type Paw = "left" | "right";

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function getNoise(ac: AudioContext) {
  if (noise) return noise;
  const len = Math.floor(ac.sampleRate * 0.12);
  noise = ac.createBuffer(1, len, ac.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) {
    // decay mũ 8 -> gõ đanh, tắt nhanh
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 8);
  }
  return noise;
}

/** Gõ phím: 1 burst noise (mặt trống) + 1 sine trầm trượt xuống (thân trống). */
export function playTap(paw: Paw, volume = 0.45) {
  const ac = getCtx();
  const t = ac.currentTime;
  const base = paw === "left" ? 170 : 250; // trống trái trầm hơn

  const src = ac.createBufferSource();
  src.buffer = getNoise(ac);
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = base * 4;
  bp.Q.value = 1.2;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(volume * 0.7, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  src.connect(bp).connect(ng).connect(ac.destination);
  src.start(t);
  src.stop(t + 0.12);

  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.exponentialRampToValueAtTime(base * 0.55, t + 0.1);
  const og = ac.createGain();
  og.gain.setValueAtTime(volume, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  osc.connect(og).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.16);
}

/**
 * Click chuột: chỉ noise lọc cao, tắt trong ~10ms, không có thành phần tuần
 * hoàn nào -> nghe khô đanh "tách" chứ không ra tiếng trống.
 *
 * Nhả nút kêu ngắn và nhẹ hơn nhấn, đúng như chuột thật.
 */
export function playClick(kind: "down" | "up", volume = 0.3) {
  const ac = getCtx();
  const t = ac.currentTime;
  const down = kind === "down";
  const dur = down ? 0.013 : 0.008;

  const src = ac.createBufferSource();
  src.buffer = getNoise(ac);
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = down ? 2600 : 3400;
  bp.Q.value = 0.8;
  const g = ac.createGain();
  g.gain.setValueAtTime(down ? volume : volume * 0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(hp).connect(bp).connect(g).connect(ac.destination);
  src.start(t);
  src.stop(t + dur + 0.01);
}
