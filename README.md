# World Cup 2026 — Trang fan dự đoán vui

Trang theo dõi World Cup 2026 **văn minh, hoàn toàn miễn phí**: lịch thi đấu tự cập nhật, trận hôm nay/ngày mai ghim đầu trang, dự đoán tỉ số bằng **điểm thưởng (WC)** 🐟, bảng xếp hạng, sơ đồ knock-out, lịch sử & thống kê, đội tuyển yêu thích, và link xem trực tiếp trên VTVGo (nhà đài có bản quyền).

> Trang fan phi thương mại, độc lập — không liên kết với FIFA, không dùng logo/biểu tượng chính thức. Đây là **trò chơi dự đoán cho vui bằng điểm thưởng — không tiền thật, không thanh toán**.

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

## Biến môi trường (để deploy đồng bộ nhiều máy)

```
DATABASE_URL=libsql://....turso.io   # Turso (mặc định local: file ./data/wc.db)
DATABASE_AUTH_TOKEN=...               # token Turso
```

## Deploy lên Vercel + Turso

1. **Tạo DB Turso** (free): `turso db create wc2026` → lấy URL: `turso db show wc2026 --url`,
   token: `turso db tokens create wc2026`. (Bảng tự tạo ở lần gọi đầu — không cần chạy schema tay.)
2. **Tạo project trên Vercel**: Add New → Project → chọn repo này (auto nhận diện Next.js).
3. **Settings → Environment Variables**: thêm `DATABASE_URL` và `DATABASE_AUTH_TOKEN` (giá trị từ bước 1).
4. **Deploy**. Sau khi xong, mọi người đăng nhập từ máy nào cũng thấy cùng dữ liệu.

## Cấu trúc

- `app/` — trang + API routes (auth, matches, bracket, leaderboard…)
- `components/` — UI components
- `lib/` — dữ liệu (teams, fixtures, bets…), scoring, server (db/auth)

## Tuỳ chỉnh dữ liệu

- `lib/data/goal-overrides.ts` — điền cầu thủ ghi bàn chính xác từng trận.
- `lib/data/channels.ts` — kênh phát + link VTVGo (`CHANNEL_OVERRIDES` để gán đúng kênh từng trận).
