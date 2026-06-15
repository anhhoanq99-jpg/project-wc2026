import type { Match } from "@/lib/types";
import { MARKET_MAP, type MarketId } from "@/lib/data/markets";
import { scorePrediction, totalPoints, type Prediction, type Standing } from "@/lib/scoring";

export interface HistoryItem {
  pred: Prediction;
  match: Match;
  settled: boolean;
  correct: boolean;
  delta: number;
}

export interface MarketStat {
  market: MarketId;
  name: string;
  total: number; // số dự đoán đã chốt
  correct: number;
  winRate: number; // 0..1
  net: number;
}

export interface PlayerRating {
  title: string;
  stars: number; // 0..5
  desc: string;
}

export interface Analytics {
  standing: Standing;
  winRate: number; // correct / settled
  totalWon: number; // tổng WC thắng được
  totalLost: number; // tổng WC thua (số dương)
  history: HistoryItem[]; // mới nhất trước
  byMarket: MarketStat[];
  best: HistoryItem[]; // dự đoán giỏi nhất (đúng, giá trị cao)
  bestStreak: number; // chuỗi đúng dài nhất
  favoriteMarket: MarketStat | null; // loại dự đoán mát tay nhất
  worstMarket: MarketStat | null; // loại dự đoán tệ nhất
  topTeamCode: string | null; // đội dự đoán nhiều nhất
  insights: string[];
  rating: PlayerRating;
}

export function rate(settled: number, winRate: number, net: number): PlayerRating {
  if (settled < 5) {
    return {
      title: "🆕 Tân binh",
      stars: 0,
      desc: "Dự đoán thêm vài trận (đã có kết quả) để hệ thống đánh giá trình độ của bạn!",
    };
  }
  let stars: number, title: string;
  if (winRate >= 0.6) {
    stars = 5;
    title = "🏆 Cao thủ dự đoán";
  } else if (winRate >= 0.5) {
    stars = 4;
    title = "🎯 Nhà phân tích";
  } else if (winRate >= 0.4) {
    stars = 3;
    title = "⚡ Người chơi cứng";
  } else if (winRate >= 0.3) {
    stars = 2;
    title = "🌱 Tay mơ học việc";
  } else {
    stars = 1;
    title = "🍀 Hên xui";
  }
  const desc =
    net >= 0
      ? "Bạn đang dương điểm — nhãn quan tốt, tiếp tục phát huy!"
      : "Bạn đang âm điểm — cân nhắc kỹ hơn và ưu tiên dự đoán chắc chắn nhé.";
  return { title, stars, desc };
}

export function computeAnalytics(
  preds: Prediction[],
  matchById: Map<string, Match>,
): Analytics {
  const standing = totalPoints(preds, matchById);

  const history: HistoryItem[] = [];
  for (const p of preds) {
    const m = matchById.get(p.matchId);
    if (!m) continue;
    const r = scorePrediction(p, m);
    history.push({ pred: p, match: m, settled: r.settled, correct: r.correct, delta: r.delta });
  }

  // Mới nhất trước (theo giờ trận).
  history.sort((a, b) => b.match.kickoff.localeCompare(a.match.kickoff));

  let totalWon = 0,
    totalLost = 0;
  for (const h of history) {
    if (!h.settled) continue;
    if (h.delta > 0) totalWon += h.delta;
    else totalLost += -h.delta;
  }

  // Theo từng loại dự đoán.
  const marketMap = new Map<MarketId, { total: number; correct: number; net: number }>();
  for (const h of history) {
    if (!h.settled) continue;
    const e = marketMap.get(h.pred.market) ?? { total: 0, correct: 0, net: 0 };
    e.total++;
    if (h.correct) e.correct++;
    e.net += h.delta;
    marketMap.set(h.pred.market, e);
  }
  const byMarket: MarketStat[] = [...marketMap.entries()].map(([market, e]) => ({
    market,
    name: MARKET_MAP[market].name,
    total: e.total,
    correct: e.correct,
    winRate: e.total ? e.correct / e.total : 0,
    net: e.net,
  }));

  const rankedMarkets = [...byMarket].filter((m) => m.total >= 2);
  const favoriteMarket =
    [...rankedMarkets].sort((a, b) => b.winRate - a.winRate)[0] ?? null;
  const worstMarket = [...rankedMarkets].sort((a, b) => a.net - b.net)[0] ?? null;

  // Dự đoán giỏi nhất: đúng + giá trị cao.
  const best = history
    .filter((h) => h.settled && h.correct)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);

  // Chuỗi đúng dài nhất (theo thứ tự thời gian trận tăng dần).
  const chrono = [...history].filter((h) => h.settled).reverse();
  let bestStreak = 0,
    cur = 0;
  for (const h of chrono) {
    if (h.correct) {
      cur++;
      bestStreak = Math.max(bestStreak, cur);
    } else cur = 0;
  }

  // Đội dự đoán nhiều nhất.
  const teamCount = new Map<string, number>();
  for (const p of preds) {
    const m = matchById.get(p.matchId);
    if (!m) continue;
    teamCount.set(m.homeCode, (teamCount.get(m.homeCode) ?? 0) + 1);
    teamCount.set(m.awayCode, (teamCount.get(m.awayCode) ?? 0) + 1);
  }
  const topTeamCode =
    [...teamCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const winRate = standing.settled ? standing.correct / standing.settled : 0;

  // Nhận xét thông minh.
  const insights: string[] = [];
  if (favoriteMarket) {
    insights.push(
      `Bạn mát tay nhất với “${favoriteMarket.name}” — đúng ${favoriteMarket.correct}/${favoriteMarket.total}.`,
    );
  }
  if (worstMarket && worstMarket.net < 0 && worstMarket !== favoriteMarket) {
    insights.push(`“${worstMarket.name}” đang khiến bạn mất điểm nhiều nhất — cân nhắc bớt lại.`);
  }
  if (bestStreak >= 2) {
    insights.push(`Chuỗi đoán đúng dài nhất của bạn: ${bestStreak} lần liên tiếp 🔥.`);
  }
  const exactCount = preds.filter((p) => p.market === "exact").length;
  if (exactCount >= 3) {
    insights.push(`Bạn khá mạnh dạn — đã dự đoán ${exactCount} lần Tỉ số chính xác (khó nhưng thưởng to).`);
  }
  if (standing.refills > 0) {
    insights.push(`Bạn đã hết điểm và được hồi ${standing.refills} lần — chơi thận trọng hơn nhé!`);
  }
  if (insights.length === 0) {
    insights.push("Chưa đủ dữ liệu để phân tích sâu — dự đoán thêm vài trận nhé!");
  }

  return {
    standing,
    winRate,
    totalWon,
    totalLost,
    history,
    byMarket,
    best,
    bestStreak,
    favoriteMarket,
    worstMarket,
    topTeamCode,
    insights,
    rating: rate(standing.settled, winRate, standing.net),
  };
}
