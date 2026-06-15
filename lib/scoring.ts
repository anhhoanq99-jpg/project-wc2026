import type { Match } from "@/lib/types";
import { MARKET_MAP, STARTING_BALANCE, type MarketId } from "@/lib/data/markets";

export interface Prediction {
  matchId: string;
  market: MarketId;
  value: string; // lựa chọn đã chọn
  createdAt: number;
}

export interface SettledPrediction {
  settled: boolean; // trận đã có kết quả chưa
  correct: boolean;
  /** Điểm cộng/trừ: +thưởng nếu đúng, −phạt nếu sai (0 nếu chưa kết thúc). */
  delta: number;
}

/** Chấm một dự đoán: đúng được thưởng, SAI bị trừ điểm phạt. */
export function scorePrediction(pred: Prediction, match: Match): SettledPrediction {
  const market = MARKET_MAP[pred.market];
  if (!market || match.status !== "finished") {
    return { settled: false, correct: false, delta: 0 };
  }
  const answer = market.resultValue(match);
  if (answer === null) return { settled: false, correct: false, delta: 0 };

  const correct = answer === pred.value;
  return { settled: true, correct, delta: correct ? market.points : -market.penalty };
}

export interface Standing {
  /** Số điểm thưởng để dự đoán (luôn > 0 — hết sẽ được hồi về mức khởi đầu). */
  balance: number;
  /** Tổng điểm để xếp hạng = khởi đầu + tổng cộng/trừ (CÓ THỂ ÂM). */
  total: number;
  /** Tổng cộng/trừ đã chốt. */
  net: number;
  /** Số lần đã được hồi điểm (bailout) khi hết điểm. */
  refills: number;
  settled: number;
  correct: number;
  wrong: number;
  pending: number;
}

/** Tổng kết từ danh sách dự đoán + bản đồ trận đấu (có cơ chế hồi điểm). */
export function totalPoints(
  preds: Prediction[],
  matchById: Map<string, Match>,
): Standing {
  let net = 0,
    settled = 0,
    correct = 0,
    wrong = 0,
    pending = 0;
  for (const p of preds) {
    const m = matchById.get(p.matchId);
    if (!m) continue;
    const r = scorePrediction(p, m);
    if (r.settled) {
      settled++;
      net += r.delta;
      if (r.correct) correct++;
      else wrong++;
    } else {
      pending++;
    }
  }

  const total = STARTING_BALANCE + net; // điểm xếp hạng (có thể âm)

  // Kho điểm: hết (≤ 0) thì hồi về mức khởi đầu, mỗi lần hồi tính 1 lần bailout.
  let refills = 0;
  let balance = total;
  if (balance <= 0) {
    refills = Math.floor(-balance / STARTING_BALANCE) + 1;
    balance = total + refills * STARTING_BALANCE;
  }

  return { balance, total, net, refills, settled, correct, wrong, pending };
}
