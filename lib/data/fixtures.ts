import type { Match, MatchStatus, Stage } from "@/lib/types";

/**
 * LỊCH VÒNG BẢNG WORLD CUP 2026 (72 trận) — dữ liệu lịch công khai trên Google
 * (Al Jazeera/ESPN/FIFA...). Giờ lưu UTC, hiển thị theo giờ VN.
 *
 * Trạng thái (sắp/đang/đã đá) được tính theo thời điểm thực tế khi mở web.
 * Tỉ số: chỉ điền các trận ĐÃ biết kết quả thật; trận khác để trống cho tới khi
 * có (cắm API để tự cập nhật tỉ số live khi bạn có API key).
 */

interface Raw {
  g: string; // bảng
  ko: string; // giờ bóng lăn (UTC ISO)
  v: string; // sân (thành phố)
  h: string; // mã đội nhà
  a: string; // mã đội khách
  hs?: number; // tỉ số đội nhà (nếu đã biết)
  as?: number; // tỉ số đội khách
}

const RAW: Raw[] = [
  // Lượt 1
  { g: "A", ko: "2026-06-11T19:00:00Z", v: "Mexico City", h: "MEX", a: "RSA", hs: 2, as: 0 },
  { g: "A", ko: "2026-06-12T02:00:00Z", v: "Guadalajara", h: "KOR", a: "CZE", hs: 2, as: 1 },
  { g: "D", ko: "2026-06-12T01:00:00Z", v: "Los Angeles", h: "USA", a: "PAR", hs: 4, as: 1 },
  { g: "B", ko: "2026-06-12T19:00:00Z", v: "Toronto", h: "CAN", a: "BIH", hs: 1, as: 1 },
  { g: "C", ko: "2026-06-13T01:00:00Z", v: "Boston", h: "HAI", a: "SCO", hs: 0, as: 1 },
  { g: "B", ko: "2026-06-13T19:00:00Z", v: "San Francisco", h: "QAT", a: "SUI", hs: 1, as: 1 },
  { g: "C", ko: "2026-06-13T22:00:00Z", v: "New York", h: "BRA", a: "MAR", hs: 1, as: 1 },
  { g: "D", ko: "2026-06-14T04:00:00Z", v: "Vancouver", h: "AUS", a: "TUR", hs: 2, as: 0 },
  // Lượt 2
  { g: "E", ko: "2026-06-14T17:00:00Z", v: "Houston", h: "GER", a: "CUW", hs: 7, as: 1 },
  { g: "F", ko: "2026-06-14T20:00:00Z", v: "Dallas", h: "NED", a: "JPN", hs: 2, as: 2 },
  { g: "E", ko: "2026-06-14T23:00:00Z", v: "Philadelphia", h: "CIV", a: "ECU", hs: 1, as: 0 },
  { g: "F", ko: "2026-06-15T02:00:00Z", v: "Monterrey", h: "SWE", a: "TUN", hs: 5, as: 1 },
  { g: "H", ko: "2026-06-15T16:00:00Z", v: "Atlanta", h: "ESP", a: "CPV", hs: 0, as: 0 },
  { g: "G", ko: "2026-06-15T19:00:00Z", v: "Vancouver", h: "BEL", a: "EGY" },
  { g: "H", ko: "2026-06-15T22:00:00Z", v: "Miami", h: "SAU", a: "URY" },
  { g: "G", ko: "2026-06-16T01:00:00Z", v: "Los Angeles", h: "IRN", a: "NZL" },
  { g: "I", ko: "2026-06-16T19:00:00Z", v: "New York", h: "FRA", a: "SEN" },
  { g: "I", ko: "2026-06-16T22:00:00Z", v: "Boston", h: "IRQ", a: "NOR" },
  { g: "J", ko: "2026-06-17T01:00:00Z", v: "Kansas City", h: "ARG", a: "ALG" },
  { g: "J", ko: "2026-06-17T04:00:00Z", v: "San Francisco", h: "AUT", a: "JOR" },
  { g: "K", ko: "2026-06-17T17:00:00Z", v: "Houston", h: "POR", a: "COD" },
  { g: "L", ko: "2026-06-17T20:00:00Z", v: "Dallas", h: "ENG", a: "CRO" },
  { g: "L", ko: "2026-06-17T23:00:00Z", v: "Toronto", h: "GHA", a: "PAN" },
  { g: "K", ko: "2026-06-18T02:00:00Z", v: "Mexico City", h: "UZB", a: "COL" },
  // Lượt 3
  { g: "A", ko: "2026-06-18T16:00:00Z", v: "Atlanta", h: "CZE", a: "RSA" },
  { g: "B", ko: "2026-06-18T19:00:00Z", v: "Los Angeles", h: "SUI", a: "BIH" },
  { g: "B", ko: "2026-06-18T22:00:00Z", v: "Vancouver", h: "CAN", a: "QAT" },
  { g: "A", ko: "2026-06-19T01:00:00Z", v: "Guadalajara", h: "MEX", a: "KOR" },
  { g: "D", ko: "2026-06-19T19:00:00Z", v: "Seattle", h: "USA", a: "AUS" },
  { g: "C", ko: "2026-06-19T22:00:00Z", v: "Boston", h: "SCO", a: "MAR" },
  { g: "C", ko: "2026-06-20T00:30:00Z", v: "Philadelphia", h: "BRA", a: "HAI" },
  { g: "D", ko: "2026-06-20T03:00:00Z", v: "San Francisco", h: "TUR", a: "PAR" },
  { g: "F", ko: "2026-06-20T17:00:00Z", v: "Houston", h: "NED", a: "SWE" },
  { g: "E", ko: "2026-06-20T20:00:00Z", v: "Toronto", h: "GER", a: "CIV" },
  { g: "E", ko: "2026-06-21T03:00:00Z", v: "Kansas City", h: "ECU", a: "CUW" },
  { g: "F", ko: "2026-06-21T04:00:00Z", v: "Monterrey", h: "TUN", a: "JPN" },
  { g: "H", ko: "2026-06-21T16:00:00Z", v: "Atlanta", h: "ESP", a: "SAU" },
  { g: "G", ko: "2026-06-21T19:00:00Z", v: "Los Angeles", h: "BEL", a: "IRN" },
  { g: "H", ko: "2026-06-21T22:00:00Z", v: "Miami", h: "URY", a: "CPV" },
  { g: "G", ko: "2026-06-22T01:00:00Z", v: "Vancouver", h: "NZL", a: "EGY" },
  { g: "J", ko: "2026-06-22T17:00:00Z", v: "Dallas", h: "ARG", a: "AUT" },
  { g: "I", ko: "2026-06-22T21:00:00Z", v: "Philadelphia", h: "FRA", a: "IRQ" },
  { g: "I", ko: "2026-06-23T00:00:00Z", v: "New York", h: "NOR", a: "SEN" },
  { g: "J", ko: "2026-06-23T03:00:00Z", v: "San Francisco", h: "JOR", a: "ALG" },
  { g: "K", ko: "2026-06-23T17:00:00Z", v: "Houston", h: "POR", a: "UZB" },
  { g: "L", ko: "2026-06-23T20:00:00Z", v: "Boston", h: "ENG", a: "GHA" },
  { g: "L", ko: "2026-06-23T23:00:00Z", v: "Toronto", h: "PAN", a: "CRO" },
  { g: "K", ko: "2026-06-24T02:00:00Z", v: "Guadalajara", h: "COL", a: "COD" },
  { g: "B", ko: "2026-06-24T19:00:00Z", v: "Vancouver", h: "SUI", a: "CAN" },
  { g: "B", ko: "2026-06-24T19:00:00Z", v: "Seattle", h: "BIH", a: "QAT" },
  { g: "C", ko: "2026-06-24T22:00:00Z", v: "Miami", h: "SCO", a: "BRA" },
  { g: "C", ko: "2026-06-24T22:00:00Z", v: "Atlanta", h: "MAR", a: "HAI" },
  { g: "A", ko: "2026-06-24T01:00:00Z", v: "Mexico City", h: "CZE", a: "MEX" },
  { g: "A", ko: "2026-06-24T01:00:00Z", v: "Monterrey", h: "RSA", a: "KOR" },
  { g: "E", ko: "2026-06-25T20:00:00Z", v: "New York", h: "ECU", a: "GER" },
  { g: "E", ko: "2026-06-25T20:00:00Z", v: "Philadelphia", h: "CUW", a: "CIV" },
  { g: "F", ko: "2026-06-25T23:00:00Z", v: "Dallas", h: "JPN", a: "SWE" },
  { g: "F", ko: "2026-06-25T23:00:00Z", v: "Kansas City", h: "TUN", a: "NED" },
  { g: "D", ko: "2026-06-26T02:00:00Z", v: "Los Angeles", h: "TUR", a: "USA" },
  { g: "D", ko: "2026-06-26T02:00:00Z", v: "San Francisco", h: "PAR", a: "AUS" },
  { g: "I", ko: "2026-06-26T19:00:00Z", v: "Boston", h: "NOR", a: "FRA" },
  { g: "I", ko: "2026-06-26T19:00:00Z", v: "Toronto", h: "SEN", a: "IRQ" },
  { g: "H", ko: "2026-06-27T00:00:00Z", v: "Houston", h: "CPV", a: "SAU" },
  { g: "H", ko: "2026-06-27T00:00:00Z", v: "Guadalajara", h: "URY", a: "ESP" },
  { g: "G", ko: "2026-06-27T03:00:00Z", v: "Seattle", h: "EGY", a: "IRN" },
  { g: "G", ko: "2026-06-27T03:00:00Z", v: "Vancouver", h: "NZL", a: "BEL" },
  { g: "L", ko: "2026-06-27T21:00:00Z", v: "New York", h: "PAN", a: "ENG" },
  { g: "L", ko: "2026-06-27T21:00:00Z", v: "Philadelphia", h: "CRO", a: "GHA" },
  { g: "K", ko: "2026-06-27T23:30:00Z", v: "Miami", h: "COL", a: "POR" },
  { g: "K", ko: "2026-06-27T23:30:00Z", v: "Atlanta", h: "COD", a: "UZB" },
  { g: "J", ko: "2026-06-28T02:00:00Z", v: "Kansas City", h: "ALG", a: "AUT" },
  { g: "J", ko: "2026-06-28T02:00:00Z", v: "Dallas", h: "JOR", a: "ARG" },
];

const MATCH_MINUTES = 110;

function resolve(r: Raw, now: number): Match {
  const ko = new Date(r.ko).getTime();
  const end = ko + MATCH_MINUTES * 60 * 1000;

  let status: MatchStatus = "upcoming";
  if (now >= end) status = "finished";
  else if (now >= ko) status = "live";

  const m: Match = {
    id: `${r.g}-${r.h}-${r.a}`,
    stage: "group" as Stage,
    group: r.g,
    kickoff: r.ko,
    venue: r.v,
    homeCode: r.h,
    awayCode: r.a,
    status,
  };

  // Chỉ gắn tỉ số nếu đã biết kết quả thật.
  if (typeof r.hs === "number" && typeof r.as === "number") {
    m.homeScore = r.hs;
    m.awayScore = r.as;
    if (status === "live") m.minute = Math.min(90, Math.floor((now - ko) / 60000));
  }

  return m;
}

/** Toàn bộ lịch (trạng thái tính theo thời điểm gọi). */
export function getAllMatches(): Match[] {
  const now = Date.now();
  return RAW.map((r) => resolve(r, now)).sort((a, b) =>
    a.kickoff.localeCompare(b.kickoff),
  );
}

export function getMatchById(id: string): Match | undefined {
  return getAllMatches().find((m) => m.id === id);
}
