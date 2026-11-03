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
- **Kiểm tra bàn phím** — sắp có.
- Giao diện sáng / tối / theo hệ thống, nhớ lựa chọn.

Phím tắt: `tab` bài mới, `ctrl + backspace` xoá cả từ, backspace ở đầu từ để
quay lại sửa từ trước (chỉ khi từ đó sai).

## Cấu trúc

- `src/typing/engine.ts` — lõi bài test (thuần TS): chấm phím, timer, tính kết quả.
- `src/typing/words.ts` — danh sách từ và bộ sinh đề.
- `src/components/typing/` — khung chữ + caret, thanh cấu hình, màn kết quả, biểu đồ.
- `src/components/cat/` — Umaru ở góc. Mở trang với `?tune` để hiện bảng leva
  canh lại tay (leva chỉ nạp khi cần).

Stack: React 19 + Vite, Tailwind CSS v4, motion, lucide-react.
