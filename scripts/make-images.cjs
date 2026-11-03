/**
 * Sinh ảnh chia sẻ (og.png) và icon PNG từ SVG vẽ tay, chụp bằng Playwright.
 *
 *   node scripts/make-images.cjs
 *
 * Cần Playwright + Chromium (npx playwright install chromium nếu máy chưa có).
 * Chỉ chạy lại khi muốn đổi ảnh, file sinh ra đã nằm sẵn trong public/.
 */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PUB = path.join(ROOT, "public");
// nhúng base64: trang setContent không được đọc file:// nên font bị bỏ qua
const fontUrl = (pkg, file) =>
  "data:font/woff2;base64," +
  fs
    .readFileSync(path.join(ROOT, "node_modules/@fontsource-variable", pkg, "files", file))
    .toString("base64");

const C = {
  bg: "#17191c",
  panel: "#202328",
  line: "#2b2f35",
  key: "#2a2e34",
  keyEdge: "#101215",
  sub: "#5d646d",
  text: "#d9dbde",
  main: "#e8a33d",
  cream: "#f3ead8",
  outline: "#0d0e10",
  pink: "#e98d9c",
};

/* ---------- font pixel 5x7 (+1 hàng đuôi chữ), chỉ đủ chữ cần dùng ---------- */
const GLYPH = {
  b: ["10000", "10000", "11110", "10001", "10001", "10001", "11110"],
  o: ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
  n: ["00000", "00000", "10110", "11001", "10001", "10001", "10001"],
  g: ["00000", "00000", "01111", "10001", "10001", "01111", "00001", "01110"],
  t: ["00100", "00100", "11111", "00100", "00100", "00100", "00011"],
  y: ["00000", "00000", "10001", "10001", "10001", "01111", "00001", "01110"],
  p: ["00000", "00000", "11110", "10001", "10001", "11110", "10000", "10000"],
  e: ["00000", "00000", "01110", "10001", "11111", "10000", "01111"],
};

function pixelText(str, x, y, px, colorOf) {
  let out = "";
  [...str].forEach((ch, i) => {
    const g = GLYPH[ch];
    g.forEach((row, r) =>
      [...row].forEach((bit, c) => {
        if (bit === "1")
          out += `<rect x="${x + (i * 6 + c) * px}" y="${y + r * px}" width="${px}" height="${px}" fill="${colorOf(i)}"/>`;
      }),
    );
  });
  return out;
}

/* ---------- mèo pixel: vẽ nửa trái rồi lật gương ---------- */
const HALF = [
  "....OO......",
  "...OWWO.....",
  "...OWPWO....",
  "..OWPPWWOOOO",
  "..OWWWWWWWWW",
  ".OWWWWWWWWWW",
  ".OWWWWWWWWWW",
  ".OWWWEEWWWWW",
  ".OWWWEEWWWWW",
  ".OWPPWWWWWWW",
  ".OWWWWWWWWOW",
  ".OWWWWWWWWWO",
  "..OWWWWWWWWW",
  "...OOOOOOOOO",
];
const CAT = HALF.map((r) => r + [...r].reverse().join(""));
const FILL = { O: C.outline, W: C.cream, P: C.pink, E: C.outline };

function sprite(grid, x, y, px) {
  let out = "";
  grid.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (FILL[ch])
        out += `<rect x="${x + c * px}" y="${y + r * px}" width="${px}" height="${px}" fill="${FILL[ch]}"/>`;
    }),
  );
  return out;
}

/** chân mèo có đệm hồng, `up` là đang nhấc lên */
function paw(x, y, px, up) {
  const g = [".OOOO.", "OWWWWO", "OWWWWO", "OWPWPO", ".OOOO."];
  return sprite(g, x, y - (up ? px : 0), px);
}

/** dải bàn phím pixel, phím thứ `hot` đang bị gõ */
function keyboard(x, y, px, cols, rows, hot) {
  let out = `<rect x="${x}" y="${y}" width="${(cols * 4 + 1) * px}" height="${(rows * 4 + 1) * px}" fill="${C.panel}"/>`;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const kx = x + (c * 4 + 1) * px;
      const ky = y + (r * 4 + 1) * px;
      const on = hot.some(([hr, hc]) => hr === r && hc === c);
      out += `<rect x="${kx}" y="${ky + 2 * px}" width="${3 * px}" height="${px}" fill="${on ? "#a8711f" : C.keyEdge}"/>`;
      out += `<rect x="${kx}" y="${ky}" width="${3 * px}" height="${2 * px}" fill="${on ? C.main : C.key}"/>`;
    }
  return out;
}

function ogSvg() {
  const W = 1200;
  const H = 630;
  const px = 14;
  // lưới chấm mờ làm nền cho có chất "pixel"
  let dots = "";
  for (let x = 20; x < W; x += 40)
    for (let y = 20; y < H; y += 40)
      dots += `<rect x="${x}" y="${y}" width="3" height="3" fill="${C.line}"/>`;

  const title = pixelText("bongotype", 84, 150, px, (i) => (i < 5 ? C.text : C.main));

  // mèo ló đầu sau bàn phím, góc phải dưới
  const cpx = 13;
  const catX = 812;
  const catY = 262;
  const cat = sprite(CAT, catX, catY, cpx);
  const cols = 7;
  const kbW = (cols * 4 + 1) * cpx;
  const kbX = catX + (CAT[0].length * cpx - kbW) / 2;
  // chỉ giấu hàng viền cằm, mặt lộ đủ
  const kbY = catY + 13 * cpx;
  // chân trái đang đè phím (phím sáng ngay dưới), chân phải nhấc lên
  const kb = keyboard(kbX, kbY, cpx, cols, 3, [[0, 2], [1, 5]]);
  const paws =
    paw(catX + 3 * cpx, kbY - 2 * cpx, cpx, false) +
    paw(catX + 15 * cpx, kbY - 2 * cpx, cpx, true);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${dots}
  ${title}
  ${cat}
  ${kb}
  ${paws}
</svg>`;
}

const OG_HTML = () => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Mono;src:url(${fontUrl("jetbrains-mono", "jetbrains-mono-vietnamese-wght-normal.woff2")});unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}
@font-face{font-family:Mono;src:url(${fontUrl("jetbrains-mono", "jetbrains-mono-latin-wght-normal.woff2")})}
@font-face{font-family:Sans;src:url(${fontUrl("lexend", "lexend-vietnamese-wght-normal.woff2")});unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}
@font-face{font-family:Sans;src:url(${fontUrl("lexend", "lexend-latin-wght-normal.woff2")})}
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:${C.bg}}
.wrap{position:relative;width:1200px;height:630px}
svg{position:absolute;inset:0}
.line{position:absolute;left:86px;top:300px;font:500 40px/1 Mono;letter-spacing:.5px;color:${C.sub};white-space:nowrap}
.line b{font-weight:500;color:${C.text}}
.line i{font-style:normal;color:${C.main}}
.caret{display:inline-block;width:4px;height:42px;background:${C.main};vertical-align:-8px;margin:0 2px}
.tag{position:absolute;left:86px;top:392px;font:400 26px/1 Sans;color:${C.sub}}
.stat{position:absolute;left:86px;top:478px;font:600 64px/1 Mono;color:${C.main}}
.stat span{font:400 22px Sans;color:${C.sub};margin-left:10px;vertical-align:8px}
</style></head><body><div class="wrap">${ogSvg()}
<div class="line"><b>gõ</b> <b>nh</b><span class="caret"></span>anh hơn</div>
<div class="tag">đo tốc độ gõ · kiểm tra bàn phím</div>
<div class="stat">128<span>wpm</span></div>
</div></body></html>`;

const ICON_HTML = (size) => `<!doctype html><html><head><style>
html,body{margin:0;width:${size}px;height:${size}px;background:transparent}
svg{display:block;width:${size}px;height:${size}px}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${size >= 192 ? 0 : 14}" fill="#1b1d21"/><g fill="#e8a33d"><ellipse cx="32" cy="40" rx="13" ry="11"/><circle cx="17" cy="26" r="5.5"/><circle cx="26" cy="18" r="5.5"/><circle cx="38" cy="18" r="5.5"/><circle cx="47" cy="26" r="5.5"/></g></svg>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(OG_HTML(), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(PUB, "og.png") });

  // icon vuông kín nền: hệ điều hành tự bo góc, để trong suốt thì thành viền đen
  for (const [size, name] of [
    [180, "apple-touch-icon.png"],
    [192, "icon-192.png"],
    [512, "icon-512.png"],
  ]) {
    const p = await browser.newPage({ viewport: { width: size, height: size } });
    await p.setContent(ICON_HTML(size === 180 ? 512 : size).replace(/512px/g, `${size}px`));
    await p.screenshot({ path: path.join(PUB, name), omitBackground: true });
    await p.close();
  }
  await browser.close();
  console.log("xong: public/og.png + icon");
})();
