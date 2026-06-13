# World Cup 2026 — Trang fan dự đoán vui

Trang theo dõi World Cup 2026 **văn minh, không cờ bạc**: lịch thi đấu tự cập nhật, trận hôm nay/ngày mai ghim đầu trang, dự đoán cá cược bằng **điểm ảo (WC)**, bảng xếp hạng, sơ đồ knock-out, lịch sử & thống kê, đội tuyển yêu thích, và link xem trực tiếp trên VTVGo (nhà đài có bản quyền).

> Trang fan phi thương mại, độc lập — không liên kết với FIFA, không dùng logo/biểu tượng chính thức. Dự đoán chơi bằng điểm ảo, **không tiền thật, không cá độ**.

## Công nghệ

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** · **Framer Motion** (hiệu ứng)
- **libsql/SQLite** (tài khoản + dữ liệu người dùng) · xác thực email/mật khẩu (scrypt)
- Dữ liệu trận đấu: TheSportsDB (miễn phí), tự cập nhật tỉ số/ghi bàn

## Chạy local

```bash
npm install
npm run dev      # http://localhost:3000
```

## Biến môi trường (tuỳ chọn, để deploy đồng bộ nhiều máy)

```
DATABASE_URL=libsql://...        # Turso (mặc định: file ./data/wc.db)
DATABASE_AUTH_TOKEN=...          # token Turso khi deploy
```

## Cấu trúc

- `app/` — trang + API routes (auth, matches, bracket, leaderboard…)
- `components/` — UI components
- `lib/` — dữ liệu (teams, fixtures, bets…), scoring, server (db/auth)

## Tuỳ chỉnh dữ liệu

- `lib/data/goal-overrides.ts` — điền cầu thủ ghi bàn chính xác từng trận.
- `lib/data/channels.ts` — kênh phát + link VTVGo (`CHANNEL_OVERRIDES` để gán đúng kênh từng trận).
