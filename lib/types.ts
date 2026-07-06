/** Kiểu dữ liệu lõi của app. Dữ liệu lịch đấu là MẪU — thay bằng lịch chính thức sau. */

export type TeamCode = string; // ISO-ish 3 ký tự, vd "VIE", "BRA"

export interface Team {
  code: TeamCode;
  name: string; // tên tiếng Việt
  flag: string; // emoji cờ (fallback; Windows không render emoji cờ)
  iso2: string; // mã ISO 3166-1 alpha-2 cho ảnh cờ (vd "vn", "gb-eng")
  group?: string; // bảng A..L
}

export type MatchStatus = "upcoming" | "live" | "finished";

export interface Goal {
  side: "home" | "away";
  player: string;
  minute: number;
  kind: "goal" | "penalty" | "own"; // bàn thường / phạt đền / phản lưới
}

export type Stage =
  | "group"
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "third"
  | "final";

export interface Match {
  id: string;
  stage: Stage;
  group?: string; // chỉ vòng bảng
  /** Thời điểm bóng lăn, lưu UTC ISO. Hiển thị theo giờ VN. */
  kickoff: string;
  venue: string; // thành phố
  homeCode: TeamCode;
  awayCode: TeamCode;
  status: MatchStatus;
  /** Bàn thắng (chỉ khi live/finished). */
  homeScore?: number;
  awayScore?: number;
  /** Tỉ số luân lưu (chỉ trận knock-out hòa sau hiệp phụ). */
  homePens?: number;
  awayPens?: number;
  /** Phút hiện tại nếu đang live (hiển thị cho vui). */
  minute?: number;
  /** Danh sách bàn thắng (cầu thủ + phút), lấy từ API cho trận đã/đang đá. */
  goals?: Goal[];
  /** ID sự kiện bên TheSportsDB (để tra cứu timeline ghi bàn). */
  apiEventId?: string;
}
