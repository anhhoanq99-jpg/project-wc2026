import type { Match } from "@/lib/types";
import {
  MARKET_MAP,
  STARTING_BALANCE,
  DEFAULT_STAKE,
  type MarketId,
} from "@/lib/data/markets";

export interface Prediction {
  matchId: string;
  market: MarketId;
  value: string; // lựa chọn đã chọn
  stake: number; // mức đặt (số điểm) — thắng được stake × odds, thua mất stake
  createdAt: number;
}

/** Tiền thắng dự kiến (làm tròn) khi đặt `stake` ở tỉ lệ `odds`. */
export function payout(stake: number, odds: number): number {
  return Math.round(stake * odds);
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
  // Mức đặt: dùng stake của dự đoán; dự đoán cũ (chưa có stake) dùng mức mặc định.
  const stake = pred.stake && pred.stake > 0 ? pred.stake : DEFAULT_STAKE;
  return { settled: true, correct, delta: correct ? payout(stake, market.odds) : -stake };
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

/**
 * Điểm KHẢ DỤNG để đặt thêm = số dư hiện có − tổng mức đặt của các dự đoán
 * CHƯA chốt (đang bị "giữ"). Không được đặt quá số điểm này.
 */
export function availableBalance(
  preds: Prediction[],
  matchById: Map<string, Match>,
): number {
  const s = totalPoints(preds, matchById);
  let locked = 0;
  for (const p of preds) {
    const m = matchById.get(p.matchId);
    if (!m || scorePrediction(p, m).settled) continue;
    locked += p.stake && p.stake > 0 ? p.stake : DEFAULT_STAKE;
  }
  return s.balance - locked;
}
