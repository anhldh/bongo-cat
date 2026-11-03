# bongo type

Đo tốc độ gõ phím kiểu monkeytype, có Umaru ngồi gõ theo ở góc màn hình.

```bash
pnpm install
pnpm dev
```

## Tính năng

- **Gõ phím** — chế độ thời gian (15/30/60/120s) hoặc số từ (10/25/50/100),
  tuỳ chọn dấu câu, số, tiếng Anh / tiếng Việt. Caret trượt mượt, tự cuộn dòng,
  kết quả có wpm, raw, độ chính xác, độ ổn định, biểu đồ theo từng giây và kỷ
  lục riêng cho từng kiểu bài.
- **Kiểm tra bàn phím** — bấm từng phím để xem phím nào nhận, phím nào chết.
  - Kích thước: 100%, TKL, 75%, 65%, 60%; chuẩn ANSI / ISO; Windows / macOS.
  - Nhãn phím: QWERTY, QWERTZ, AZERTY, Dvorak, Colemak, hoặc "theo máy"
    (đọc layout thật qua Keyboard API, chỉ có trên Chrome/Edge).
  - Đếm số lần bấm, thời gian giữ, số phím giữ cùng lúc tối đa (rollover),
    phát hiện phím bị double (nhả rồi nhận lại trong 35ms), log sự kiện, liệt
    kê phím nằm ngoài sơ đồ (phím media...).
  - Nút khoá: toàn màn hình + Keyboard Lock để bắt được cả Esc, phím Win,
    Alt+Tab (Chrome/Edge).
- Giao diện sáng / tối / theo hệ thống, nhớ lựa chọn.

Phím tắt: `tab` bài mới, `ctrl + backspace` xoá cả từ, backspace ở đầu từ để
quay lại sửa từ trước (chỉ khi từ đó sai).

## Deploy (Cloudflare Pages / Vercel)

- Build command: `pnpm build`, output: `dist`.
- Domain cho canonical + ảnh chia sẻ: đặt `VITE_SITE_URL` (xem `.env.example`)
  trong biến môi trường của Cloudflare Pages / Vercel. Không đặt thì tự lấy
  domain nền tảng cấp (`CF_PAGES_URL`, `VERCEL_PROJECT_PRODUCTION_URL`).
- Ảnh chia sẻ `public/og.png` và icon sinh bằng `node scripts/make-images.cjs`
  (cần Playwright). Chỉ chạy lại khi muốn đổi ảnh.

## Cấu trúc

- `src/typing/engine.ts` — lõi bài test (thuần TS): chấm phím, timer, tính kết quả.
- `src/typing/words.ts` — danh sách từ và bộ sinh đề.
- `src/components/typing/` — khung chữ + caret, thanh cấu hình, màn kết quả, biểu đồ.
- `src/keyboard/` — sơ đồ phím vật lý (`layouts.ts`), nhãn theo layout gõ
  (`labels.ts`), hook bắt phím (`useKeyTester.ts`).
- `src/components/keyboard/` — giao diện trang kiểm tra phím.
- `src/components/cat/` — Umaru ở góc. Mở trang với `?tune` để hiện bảng leva
  canh lại tay (leva chỉ nạp khi cần).

Stack: React 19 + Vite, Tailwind CSS v4, motion, lucide-react.
