import type { Match } from "@/lib/types";
import { getTeam } from "@/lib/data/teams";

/**
 * Các loại DỰ ĐOÁN vui — CHƠI BẰNG ĐIỂM THƯỞNG, HOÀN TOÀN MIỄN PHÍ.
 * Điểm thưởng cao/thấp tạo cảm giác hồi hộp & vui nhưng tuyệt đối 0 đồng.
 */

export type MarketId = "1x2" | "exact" | "ou25" | "btts" | "totals";

/** Số dư WC mỗi người có khi bắt đầu chơi (hết sẽ được hồi lại đúng mức này). */
export const STARTING_BALANCE = 10_000_000;

export interface MarketOption {
  value: string;
  label: string;
}

export interface Market {
  id: MarketId;
  name: string;
  short: string;
  /** Điểm thưởng khi đoán ĐÚNG (càng khó càng cao). */
  points: number;
  /** Điểm bị TRỪ khi đoán SAI (rủi ro của dự đoán). */
  penalty: number;
  desc: string;
  /** Lựa chọn cho 1 trận. Rỗng nghĩa là nhập tay (dự đoán tỉ số chính xác). */
  options: (m: Match) => MarketOption[];
  /** Đáp án đúng cho trận đã có tỉ số; null nếu chưa đủ dữ liệu. */
  resultValue: (m: Match) => string | null;
}

function hasScore(m: Match): m is Match & { homeScore: number; awayScore: number } {
  return typeof m.homeScore === "number" && typeof m.awayScore === "number";
}

export const MARKETS: Market[] = [
  {
    id: "1x2",
    name: "Thắng – Hòa – Thua",
    short: "1X2",
    points: 100_000,
    penalty: 80_000,
    desc: "Đoán đội thắng hoặc hòa.",
    options: (m) => [
      { value: "H", label: `${getTeam(m.homeCode).name} thắng` },
      { value: "D", label: "Hòa" },
      { value: "A", label: `${getTeam(m.awayCode).name} thắng` },
    ],
    resultValue: (m) =>
      !hasScore(m)
        ? null
        : m.homeScore > m.awayScore
          ? "H"
          : m.homeScore < m.awayScore
            ? "A"
            : "D",
  },
  {
    id: "exact",
    name: "Tỉ số chính xác",
    short: "Tỉ số",
    points: 600_000,
    penalty: 150_000,
    desc: "Đoán đúng tỉ số cuối trận. Khó nhất, thưởng cao nhất!",
    options: () => [], // nhập tay
    resultValue: (m) => (!hasScore(m) ? null : `${m.homeScore}-${m.awayScore}`),
  },
  {
    id: "ou25",
    name: "Trên / Dưới 2.5",
    short: "Trên/Dưới",
    points: 120_000,
    penalty: 120_000,
    desc: "Tổng số bàn cả trận trên hay dưới mốc 2.5.",
    options: () => [
      { value: "O", label: "Trên (≥ 3 bàn)" },
      { value: "U", label: "Dưới (≤ 2 bàn)" },
    ],
    resultValue: (m) =>
      !hasScore(m) ? null : m.homeScore + m.awayScore >= 3 ? "O" : "U",
  },
  {
    id: "btts",
    name: "Cả hai đội ghi bàn",
    short: "2 đội ghi bàn",
    points: 140_000,
    penalty: 120_000,
    desc: "Liệu cả hai đội đều có bàn thắng?",
    options: () => [
      { value: "Y", label: "Có" },
      { value: "N", label: "Không" },
    ],
    resultValue: (m) =>
      !hasScore(m) ? null : m.homeScore > 0 && m.awayScore > 0 ? "Y" : "N",
  },
  {
    id: "totals",
    name: "Tổng số bàn thắng",
    short: "Tổng bàn",
    points: 200_000,
    penalty: 100_000,
    desc: "Đoán nhóm tổng số bàn của cả trận.",
    options: () => [
      { value: "0-1", label: "0–1 bàn" },
      { value: "2-3", label: "2–3 bàn" },
      { value: "4+", label: "4+ bàn" },
    ],
    resultValue: (m) => {
      if (!hasScore(m)) return null;
      const t = m.homeScore + m.awayScore;
      return t <= 1 ? "0-1" : t <= 3 ? "2-3" : "4+";
    },
  },
];

export const MARKET_MAP: Record<MarketId, Market> = Object.fromEntries(
  MARKETS.map((mk) => [mk.id, mk]),
) as Record<MarketId, Market>;

/** Nhãn dễ đọc cho một lựa chọn đã chọn. */
export function selectionLabel(m: Match, marketId: MarketId, value: string): string {
  const market = MARKET_MAP[marketId];
  if (marketId === "exact") return `Tỉ số ${value}`;
  return market.options(m).find((o) => o.value === value)?.label ?? value;
}
