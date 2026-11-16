# NOTE — Bản hoàn chỉnh ultra-premium (`design/final/`)

> Zen dựng lại toàn bộ dàn slide dạng **web (HTML/CSS/JS)** với phong cách **dark editorial**,
> giữ **100% số liệu** đã xác minh trong `data/DATA_PACK_ZEN.md`. Chạy **offline**, một stage
> 1920×1080 tự co giãn, font + KaTeX nội bộ.

## 1. Chạy thế nào

Mở `index.html` bằng trình duyệt (Chromium/Firefox/Edge). Không cần server, không cần mạng.

| Thao tác | Phím |
|---|---|
| Trang trước / sau | `←` `→` `Space` `PgUp` `PgDn` |
| Nhảy tới trang | `1`…`8`, `Home`, `End` |
| Tổng quan (8 thumbnail thật) | `O` |
| Xem lại hiệu ứng / dây cung | `R` |
| Toàn màn hình | `F` |
| Bảng phím tắt | `?` |
| Thoát / đóng | `Esc` |
| Chạm màn hình | vuốt trái / phải |

## 2. Cấu trúc file

```
final/
  index.html            ← toàn bộ 8 slide + nội dung (chỉnh sửa ở đây)
  assets/app.css        ← design system (màu, type, component, motion)
  assets/app.js         ← điều hướng, reveal, count-up, SVG charts, secant→tangent, overview
  assets/fonts/         ← Be Vietnam Pro + Playfair Display + IBM Plex Mono (có subset tiếng Việt)
  assets/katex/         ← KaTeX nội bộ
  fetch_fonts.py        ← cách tải lại font về offline
  render.py             ← render 8 slide ra PNG (Playwright/Chromium) + báo cáo lỗi
  render/slide_01..08.png
```

**Chỉnh sửa nội dung:** mở `index.html`, tìm `<section class="slide sN" …>`. Mỗi khối có thể
reveal tại một dòng `class="… rv" style="--d:.20s"` (`--d` = độ trễ, tăng dần theo nhịp).
**Thêm/sửa công thức:** dùng `\( … \)` (inline) hoặc `\[ … \]` (công thức riêng dòng).

## 3. Thiết kế

- **Vibe:** Editorial Luxury — nền mực `#070A11`, chữ phân trang `#F4F0E6`, tông amber `#E7B44B`
  + cyan `#56C6DB`, hairline `rgba(244,240,230,.09)`, grain mờ 5%, khung 26px.
- **Type:** Playfair Display (bực chữ số/tiêu đề, có Vietnamese subset), Be Vietnam Pro (nội dung),
  IBM Plex Mono (nhãn số liệu/đơn vị). Không dùng Inter/Roboto/Arial.
- **Layout:** stage 1920×1080 cố định, scale theo cửa sổ; lề 96px; lưới 2/3 cột; card bo 22px,
  viền tóc + highlight một phần trên.
- **Motion:** chuyển cảnh có hướng (`cubic-bezier(.22,.8,.24,1)`), reveal từng khối theo beat,
  đồ thị vẽ dần (`stroke-dashoffset`), số count-up, secant→tiếp tuyến, thuyền/runner chuyển động,
  hover lift + sheen. Hỗ trợ `prefers-reduced-motion`.

## 4. 8 slide

| # | Nội dung | Nguồn |
|---|---|---|
| 1 | Bìa — câu hỏi định giá vé | SGK tr. 33 · ảnh minh hoạ |
| 2 | Vé bóng đá — tối đa hoá doanh thu (đề nguyên văn, lời giải, đồ thị, bảng biến thiên) | SGK tr. 33, 38–39 |
| 3 | Tốc độ thay đổi: trung bình → tức thời (secant→tiếp tuyến) + 5 ứng dụng | SGK tr. 33–34 |
| 4 | Ba bước giải bài toán tối ưu hoá | SGK tr. 36–37 |
| 5 | Dạng 1 — huyết áp (Luyện tập 1) + hạt chuyển động (1.26) | SGK tr. 36, 40 |
| 6 | Dạng 2 — Anh An chèo thuyền + hộp trụ 1 lít | SGK tr. 37–38 |
| 7 | Dạng 3 — ti vi, chi phí biên 1.27, chung cư 1.28, hàm cầu 354 (1.29) | SGK tr. 40–41 |
| 8 | Chốt: 3 dạng + 5 cặp dễ nhầm + nguồn | SGK tr. 33–41 |

**Điểm số cố định (không sửa/làm tròn):** `55 000 · 100 · 27 000 · 10 · 3 000 · 95 · 2 707 500 ·
28 500 · 125 · −250/169 ≈ −1,4793 · 23 m · −9 m · 9/√7 ≈ 3,4017 · 1+√7/8 ≈ 1,3307 ·
∛(500/π) ≈ 5,4193 · 100/∛(250π) ≈ 10,8385 · h=2r · p=−x/200+19 · 9,5 · 8 · 2 200 ·
12 200 · 12,2 · 2,5 · 2,52675 · 810 · x=35 400/p − 100`.
Không dùng các số ở mục **7. CẤM DÙNG** của data pack (123, 2 500 000x, 9 m, 2 300, 8,5 triệu…).

## 5. Kiểm chứng (bằng bằng chứng thật)

- `python render.py` → 8 ảnh 1920×1080, **0 console error / 0 pageerror** (xem `render/report.json`).
- QA hình học từng slide: không phần tử nào vượt khung an toàn 102..988 (kể cả sau khi reveal xong).
- QA tương tác: `←/→`, nhảy số, `O` (8 iframe thumbnail), `R`, hash `#n`, count-up đúng `95` /
  `2 707 500`.
- Mọi điểm nghiêng/label trong SVG đã cân chỉnh theo DOM (không đoán).

## 6. Lịch sử phiên bản

Mỗi lần chỉnh sửa: `python tools/version.py snap "mô tả"`.
Xem `python tools/version.py list`, so sánh `python tools/version.py diff v001 v002`,
khôi phục `python tools/version.py restore v001`. Xem `design/snapshots/INDEX.md`.

## 7. Xem web trực tiếp (live)

```bash
python tools/serve.py          # cổng 8817
```

- <http://127.0.0.1:8817/live.html> — **trang xem trực tiếp**, tự làm tươi mỗi ~1,5s khi
  bất kỳ file slide nào đổi (đổi trang bằng `←` `→`, `1`…`8`, hoặc nút ở góc).
- <http://127.0.0.1:8817/index.html> — bản trượt thuần (đầy đủ HUD + tương tác).

Mở `live.html` bằng trình duyệt trực tiếp (file://) vẫn xem được, nhưng không tự làm tươi.

