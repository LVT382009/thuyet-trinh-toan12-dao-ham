# Thuyết trình Toán 12 · Bài 5 — Ứng dụng đạo hàm

Slide web trình chiếu **Ứng dụng đạo hàm vào bài toán thực tế** — Toán 12, Tập một,
SGK Kết nối tri thức, trang 33–41. 8 slide, giao diện sáng (nền trắng ngà), công
thức KaTeX, biểu đồ SVG động.

## Chạy

Không cần build. Bất kỳ static server nào:

```bash
python -m http.server 8000
# mở http://localhost:8000
```

## Điều hướng

| Phím | Chức năng |
|---|---|
| `→` / `←` / `Space` | slide sau / trước |
| `1`–`8` | nhảy tới slide |
| `O` | overview (thumbnails) |
| `F` | toàn màn hình |
| `?` | trợ giúp |

## Nội dung 8 slide

1. Mở đầu — câu chuyện vé bóng đá
2. Ví dụ 1: Vé bóng đá — tối đa doanh thu (đồ thị R(p))
3. Tốc độ thay đổi — trung bình → tức thời (dây cung → tiếp tuyến)
4. Ba bước giải bài toán tối ưu hóa
5. Luyện tập 1: Huyết áp (P(t), tiếp tuyến tại t = 5)
6. Luyện tập 2: Anh An chèo thuyền (song song ba cách đi) + Hộp trụ 1 lít
7. Vận dụng: Chuỗi kinh tế (hai đỉnh R(p), P(x)) + Chi phí biên
8. Chốt: Ba dạng bài + nguồn & ghi chú

## Cấu trúc

```
index.html          toàn bộ nội dung slide + SVG minh họa
assets/app.css      design tokens, layout, hiệu ứng
assets/app.js       deck engine: nav, reveal, count-up, biểu đồ SVG động
assets/katex/       KaTeX 0.16.11 (vendored — chạy offline)
assets/fonts/       Playfair Display, Be Vietnam Pro, IBM Plex Mono (vendored)
render/             ảnh chụp 8 slide (render.py, cần Chrome/Chromium local)
```

## Chú ý kỹ thuật

- **font + KaTeX vendored** — site chạy hoàn toàn offline, không CDN.
- **prefers-reduced-motion bị bỏ qua** (theo yêu cầu): animation luôn chạy kể cả
  khi OS bật "giảm chuyển động". Cách khôi phục: xem comment trong `assets/app.css`
  và `assets/app.js`.
- Nền trắng ngà `#FBF8F1`, mực `#1A160E`, nhấn hổ phách `#A87A20`.

## Tái tạo ảnh slide

```bash
DECK_CHROME="/path/to/chrome" python render.py
```

## Credit

Nội dung giáo khoa: SGK Toán 12 — Tập một, NXB Giáo dục Việt Nam (2024),
Bài 5, trang 33–41. Slide chỉ mang tính học thuật / phi thương mại.