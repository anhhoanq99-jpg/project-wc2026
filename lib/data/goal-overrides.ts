import type { Goal } from "@/lib/types";

/**
 * CẦU THỦ GHI BÀN ĐẦY ĐỦ — nhập tay theo từng trận, nguồn: Wikipedia (các trang
 * "2026 FIFA World Cup Group A…L"), đối chiếu chéo với TheSportsDB.
 *
 * Khi một trận có ở đây, app ưu tiên dùng danh sách này (đủ tên, khớp tỉ số) thay
 * cho dữ liệu API (vốn đôi khi thiếu).
 *
 * Khoá = id trận (xem lib/data/fixtures.ts, dạng "BẢNG-ĐỘINHÀ-ĐỘIKHÁCH").
 * side: "home" = đội nhà, "away" = đội khách (theo lịch nội bộ).
 * kind: "goal" = bàn thường, "penalty" = phạt đền, "own" = phản lưới.
 * minute: phút cơ bản (bàn bù giờ hiệp 1 ghi 45, bù giờ hiệp 2 ghi 90).
 */
export const GOAL_OVERRIDES: Record<string, Goal[]> = {
  // Bảng A
  "A-MEX-RSA": [
    { side: "home", player: "Julián Quiñones", minute: 9, kind: "goal" },
    { side: "home", player: "Raúl Jiménez", minute: 67, kind: "goal" },
  ],
  "A-KOR-CZE": [
    { side: "away", player: "Ladislav Krejčí", minute: 59, kind: "goal" },
    { side: "home", player: "Hwang In-beom", minute: 67, kind: "goal" },
    { side: "home", player: "Oh Hyeon-gyu", minute: 80, kind: "goal" },
  ],

  // Bảng B
  "B-CAN-BIH": [
    { side: "away", player: "Jovo Lukić", minute: 21, kind: "goal" },
    { side: "home", player: "Cyle Larin", minute: 78, kind: "goal" },
  ],
  "B-QAT-SUI": [
    { side: "away", player: "Breel Embolo", minute: 17, kind: "penalty" },
    { side: "home", player: "Miro Muheim (phản lưới)", minute: 90, kind: "own" },
  ],

  // Bảng C
  "C-BRA-MAR": [
    { side: "away", player: "Ismael Saibari", minute: 21, kind: "goal" },
    { side: "home", player: "Vinícius Júnior", minute: 32, kind: "goal" },
  ],
  "C-HAI-SCO": [{ side: "away", player: "John McGinn", minute: 28, kind: "goal" }],

  // Bảng D
  "D-USA-PAR": [
    { side: "home", player: "Damián Bobadilla (phản lưới)", minute: 7, kind: "own" },
    { side: "home", player: "Folarin Balogun", minute: 31, kind: "goal" },
    { side: "home", player: "Folarin Balogun", minute: 45, kind: "goal" },
    { side: "away", player: "Maurício", minute: 73, kind: "goal" },
    { side: "home", player: "Giovanni Reyna", minute: 90, kind: "goal" },
  ],
  "D-AUS-TUR": [
    { side: "home", player: "Nestory Irankunda", minute: 27, kind: "goal" },
    { side: "home", player: "Connor Metcalfe", minute: 75, kind: "goal" },
  ],

  // Bảng E
  "E-GER-CUW": [
    { side: "home", player: "Felix Nmecha", minute: 6, kind: "goal" },
    { side: "away", player: "Livano Comenencia", minute: 21, kind: "goal" },
    { side: "home", player: "Nico Schlotterbeck", minute: 38, kind: "goal" },
    { side: "home", player: "Kai Havertz", minute: 45, kind: "penalty" },
    { side: "home", player: "Jamal Musiala", minute: 47, kind: "goal" },
    { side: "home", player: "Nathaniel Brown", minute: 68, kind: "goal" },
    { side: "home", player: "Deniz Undav", minute: 78, kind: "goal" },
    { side: "home", player: "Kai Havertz", minute: 88, kind: "goal" },
  ],
  "E-CIV-ECU": [{ side: "home", player: "Amad Diallo", minute: 90, kind: "goal" }],

  // Bảng F
  "F-NED-JPN": [
    { side: "home", player: "Virgil van Dijk", minute: 50, kind: "goal" },
    { side: "away", player: "Keito Nakamura", minute: 57, kind: "goal" },
    { side: "home", player: "Crysencio Summerville", minute: 64, kind: "goal" },
    { side: "away", player: "Daichi Kamada", minute: 88, kind: "goal" },
  ],
  "F-SWE-TUN": [
    { side: "home", player: "Yasin Ayari", minute: 7, kind: "goal" },
    { side: "home", player: "Alexander Isak", minute: 30, kind: "goal" },
    { side: "away", player: "Omar Rekik", minute: 43, kind: "goal" },
    { side: "home", player: "Viktor Gyökeres", minute: 59, kind: "goal" },
    { side: "home", player: "Mattias Svanberg", minute: 84, kind: "goal" },
    { side: "home", player: "Yasin Ayari", minute: 90, kind: "goal" },
  ],
};
