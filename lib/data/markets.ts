import type { Match } from "@/lib/types";
import { getTeam } from "@/lib/data/teams";

/**
 * Các loại DỰ ĐOÁN vui — CHƠI BẰNG ĐIỂM THƯỞNG, HOÀN TOÀN MIỄN PHÍ.
 * Người chơi tự chọn MỨC ĐẶT; thắng được mức đặt × tỉ lệ (odds), thua mất mức đặt.
 */

export type MarketId =
  | "1x2"
  | "exact"
  | "ou25"
  | "btts"
  | "totals"
  | "ou15"
  | "ou35"
  | "oddeven"
  | "margin"
  | "cleansheet";

/** Số dư WC mỗi người có khi bắt đầu chơi (hết sẽ được hồi lại đúng mức này). */
export const STARTING_BALANCE = 10_000_000;

/* ----------------------------- mức đặt ----------------------------- */
export const MIN_STAKE = 100_000;
export const DEFAULT_STAKE = 1_000_000;
/** Các mức đặt nhanh (chip) cho người chơi bấm chọn. */
export const STAKE_PRESETS = [100_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

export interface MarketOption {
  value: string;
  label: string;
}

export interface Market {
  id: MarketId;
  name: string;
  short: string;
  /** Tỉ lệ thắng: ĐÚNG được (mức đặt × odds), SAI mất mức đặt. Càng khó odds càng cao. */
  odds: number;
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
    odds: 1.25,
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
    odds: 4,
    desc: "Đoán đúng tỉ số cuối trận. Khó nhất, tỉ lệ cao nhất!",
    options: () => [], // nhập tay
    resultValue: (m) => (!hasScore(m) ? null : `${m.homeScore}-${m.awayScore}`),
  },
  {
    id: "ou25",
    name: "Trên / Dưới 2.5",
    short: "T/D 2.5",
    odds: 1,
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
    odds: 1.15,
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
    odds: 2,
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

  /* ------------------------ LOẠI DỰ ĐOÁN MỚI ------------------------ */
  {
    id: "ou15",
    name: "Trên / Dưới 1.5",
    short: "T/D 1.5",
    odds: 1.3,
    desc: "Tổng số bàn cả trận trên hay dưới mốc 1.5.",
    options: () => [
      { value: "O", label: "Trên (≥ 2 bàn)" },
      { value: "U", label: "Dưới (≤ 1 bàn)" },
    ],
    resultValue: (m) =>
      !hasScore(m) ? null : m.homeScore + m.awayScore >= 2 ? "O" : "U",
  },
  {
    id: "ou35",
    name: "Trên / Dưới 3.5",
    short: "T/D 3.5",
    odds: 2.2,
    desc: "Trận có nhiều bàn không? Trên hay dưới mốc 3.5.",
    options: () => [
      { value: "O", label: "Trên (≥ 4 bàn)" },
      { value: "U", label: "Dưới (≤ 3 bàn)" },
    ],
    resultValue: (m) =>
      !hasScore(m) ? null : m.homeScore + m.awayScore >= 4 ? "O" : "U",
  },
  {
    id: "oddeven",
    name: "Tổng bàn Chẵn / Lẻ",
    short: "Chẵn/Lẻ",
    odds: 1.9,
    desc: "Tổng số bàn cả trận là số chẵn hay lẻ (0 tính là chẵn).",
    options: () => [
      { value: "E", label: "Chẵn" },
      { value: "O", label: "Lẻ" },
    ],
    resultValue: (m) =>
      !hasScore(m) ? null : (m.homeScore + m.awayScore) % 2 === 0 ? "E" : "O",
  },
  {
    id: "margin",
    name: "Cách biệt thắng",
    short: "Cách biệt",
    odds: 3,
    desc: "Đội thắng cách biệt mấy bàn (hoặc hòa)?",
    options: () => [
      { value: "draw", label: "Hòa" },
      { value: "1", label: "Thắng 1 bàn" },
      { value: "2", label: "Thắng 2 bàn" },
      { value: "3+", label: "Thắng ≥ 3 bàn" },
    ],
    resultValue: (m) => {
      if (!hasScore(m)) return null;
      const diff = Math.abs(m.homeScore - m.awayScore);
      return diff === 0 ? "draw" : diff === 1 ? "1" : diff === 2 ? "2" : "3+";
    },
  },
  {
    id: "cleansheet",
    name: "Có đội giữ sạch lưới?",
    short: "Sạch lưới",
    odds: 1.8,
    desc: "Có ít nhất một đội không bị thủng lưới (giữ sạch lưới)?",
    options: () => [
      { value: "Y", label: "Có" },
      { value: "N", label: "Không" },
    ],
    resultValue: (m) =>
      !hasScore(m) ? null : m.homeScore === 0 || m.awayScore === 0 ? "Y" : "N",
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
