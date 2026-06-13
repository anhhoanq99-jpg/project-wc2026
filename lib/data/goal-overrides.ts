import type { Goal } from "@/lib/types";

/**
 * CẦU THỦ GHI BÀN ĐẦY ĐỦ — nhập tay theo từng trận (vd tra kết quả trên Google).
 * Khi một trận có ở đây, app sẽ ưu tiên dùng danh sách này (đủ tên, khớp tỉ số)
 * thay cho dữ liệu API (vốn đôi khi thiếu).
 *
 * Khoá = id trận (xem ở lib/data/fixtures.ts, dạng "BẢNG-ĐỘINHÀ-ĐỘIKHÁCH").
 * side: "home" = đội nhà, "away" = đội khách.
 * kind: "goal" = bàn thường, "penalty" = phạt đền, "own" = phản lưới.
 *
 * Ví dụ (điền tên thật vào rồi bỏ dấu //):
 * "D-USA-PAR": [
 *   { side: "home", player: "Damián Bobadilla", minute: 7,  kind: "goal" },
 *   { side: "home", player: "Folarin Balogun",  minute: 31, kind: "goal" },
 *   { side: "home", player: "Folarin Balogun",  minute: 45, kind: "goal" },
 *   { side: "home", player: "Tên cầu thủ thứ 4", minute: 70, kind: "goal" },
 *   { side: "away", player: "Tên cầu thủ Paraguay", minute: 80, kind: "goal" },
 * ],
 */
export const GOAL_OVERRIDES: Record<string, Goal[]> = {
  // USA 4–1 Paraguay (Group D) — nguồn: Sky Sports, ESPN, CBS, Al Jazeera, NPR.
  // 4 bàn của Mỹ đã xác minh chéo nhiều báo. Bàn của Paraguay (phút 73) chưa có
  // tên cầu thủ đáng tin -> tạm để hệ thống ghi "chưa rõ" cho tới khi xác minh.
  "D-USA-PAR": [
    { side: "home", player: "Damián Bobadilla (phản lưới)", minute: 7, kind: "own" },
    { side: "home", player: "Folarin Balogun", minute: 31, kind: "goal" },
    { side: "home", player: "Folarin Balogun", minute: 45, kind: "goal" },
    { side: "home", player: "Giovanni Reyna", minute: 90, kind: "goal" },
  ],
};
