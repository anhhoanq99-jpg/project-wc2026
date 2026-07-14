"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Coins } from "lucide-react";
import type { Match } from "@/lib/types";
import {
  MARKETS,
  type MarketId,
  STAKE_PRESETS,
  DEFAULT_STAKE,
  MIN_STAKE,
  MAX_STAKE,
} from "@/lib/data/markets";
import { payout, availableBalance, type Prediction } from "@/lib/scoring";
import { getTeam } from "@/lib/data/teams";
import { fmtNum } from "@/lib/format";
import { placePrediction, removePrediction } from "@/lib/storage";
import { usePredictions, useBonus } from "@/components/use-store";
import { useMatches } from "@/components/use-matches";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Flag } from "@/components/flag";
import { cn } from "@/lib/utils";

/** Nhãn gọn cho mức đặt: 100K, 1 triệu, 5 tỉ, 2 nghìn tỉ… */
function stakeChip(n: number): string {
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  if (n >= 1_000_000_000_000) return `${fmt(n / 1_000_000_000_000)} nghìn tỉ`;
  if (n >= 1_000_000_000) return `${fmt(n / 1_000_000_000)} tỉ`;
  if (n >= 1_000_000) return `${fmt(n / 1_000_000)} triệu`;
  return `${Math.round(n / 1000)}K`;
}

export function PredictionSheet({ match, onClose }: { match: Match; onClose: () => void }) {
  const preds = usePredictions();
  const bonus = useBonus();
  const matches = useMatches();
  const toast = useToast();
  const home = getTeam(match.homeCode);
  const away = getTeam(match.awayCode);

  // Mức đặt đang chọn (áp cho dự đoán đặt tiếp theo).
  const [stake, setStake] = useState<number>(DEFAULT_STAKE);
  const betStake = Math.min(
    MAX_STAKE,
    Number.isFinite(stake) && stake >= MIN_STAKE ? Math.floor(stake) : MIN_STAKE,
  );

  const predOf = (market: MarketId): Prediction | undefined =>
    preds.find((p) => p.matchId === match.id && p.market === market);

  // Điểm khả dụng = số dư − tổng đang đặt chưa chốt. Không cho đặt quá số này.
  const matchById = new Map((matches ?? []).map((m) => [m.id, m]));
  const avail = availableBalance(preds, matchById, bonus);
  /** Khả dụng cho 1 loại dự đoán: đặt lại cùng loại thì mức đặt cũ được hoàn. */
  const availFor = (cur?: Prediction) => avail + (cur?.stake ?? 0);
  /** Kiểm tra đủ điểm trước khi đặt; báo lỗi nếu thiếu. */
  const canAfford = (want: number, cur?: Prediction): boolean => {
    const free = availFor(cur);
    if (want <= free) return true;
    toast({
      title: "Không đủ điểm thưởng",
      description: `Bạn chỉ còn ${fmtNum(Math.max(0, free))} WC khả dụng — hạ mức đặt xuống nhé.`,
      variant: "error",
    });
    return false;
  };

  return (
    <Modal
      onClose={onClose}
      placement="sheet"
      ariaLabel="Đặt dự đoán trận đấu"
      panelClassName="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl sm:rounded-2xl"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-5 py-4 backdrop-blur">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Dự đoán vui · điểm thưởng
          </p>
          <p className="flex items-center gap-1.5 font-bold">
            <Flag code={match.homeCode} size={22} />
            {home.name} <span className="text-muted">vs</span> {away.name}
            <Flag code={match.awayCode} size={22} />
          </p>
        </div>
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* BỘ CHỌN MỨC ĐẶT */}
      <div className="border-b border-border bg-surface-2/30 px-5 py-4">
        <p className="mb-2 flex items-center justify-between gap-1.5 text-sm font-semibold">
          <span className="flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-brand" />
            Mức đặt mỗi dự đoán
          </span>
          <span className="text-xs font-medium text-muted">
            Khả dụng:{" "}
            <span className={cn("font-bold", avail >= MIN_STAKE ? "text-brand" : "text-danger")}>
              {fmtNum(Math.max(0, avail))} WC
            </span>
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {STAKE_PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={betStake === s}
              onClick={() => setStake(s)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                betStake === s
                  ? "bg-brand text-brand-foreground"
                  : "border border-border hover:bg-surface-2",
              )}
            >
              {stakeChip(s)}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label htmlFor="custom-stake" className="text-xs text-muted">
            Tùy chọn:
          </label>
          <input
            id="custom-stake"
            type="number"
            min={MIN_STAKE}
            max={MAX_STAKE}
            step={100_000}
            value={stake}
            onChange={(e) => setStake(parseInt(e.target.value, 10) || 0)}
            className="h-9 w-36 rounded-lg border border-input bg-background px-3 text-sm font-semibold focus:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
          <span className="text-xs text-muted">
            WC · tối thiểu {stakeChip(MIN_STAKE)} — tối đa bằng số điểm đang có
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {MARKETS.map((mk) => {
          const cur = predOf(mk.id);
          const win = payout(betStake, mk.odds);
          return (
            <div key={mk.id}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{mk.name}</p>
                  <p className="text-xs text-muted">{mk.desc}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-brand">
                    Tỉ lệ ×{mk.odds}
                  </span>
                  <p className="mt-1 text-[11px] text-muted">
                    Thắng <span className="font-semibold text-brand">+{fmtNum(win)}</span>
                  </p>
                </div>
              </div>

              {mk.id === "exact" ? (
                <ExactScorePicker
                  match={match}
                  current={cur}
                  stake={betStake}
                  canAfford={canAfford}
                />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {mk.options(match).map((o) => {
                    const active = cur?.value === o.value;
                    return (
                      <motion.button
                        key={o.value}
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          // Bấm lại đúng lựa chọn & cùng mức đặt -> bỏ; ngược lại đặt/cập nhật.
                          if (active && cur?.stake === betStake) {
                            removePrediction(match.id, mk.id);
                            toast({ title: "Đã bỏ dự đoán", description: mk.name });
                          } else {
                            if (!canAfford(betStake, cur)) return;
                            placePrediction(match.id, mk.id, o.value, betStake);
                            toast({
                              title: "Đã lưu dự đoán 🎯",
                              description: `${mk.name}: ${o.label} · đặt ${fmtNum(betStake)} → thắng +${fmtNum(payout(betStake, mk.odds))}`,
                              variant: "success",
                            });
                          }
                        }}
                        className={cn(
                          "rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                          active
                            ? "border-brand bg-brand/15 text-brand"
                            : "border-border hover:bg-surface-2",
                        )}
                      >
                        {active && <Check className="mr-1 inline h-3.5 w-3.5" />}
                        {o.label}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {cur && (
                <p className="mt-2 text-xs text-muted">
                  Đang đặt <span className="font-semibold text-foreground">{fmtNum(cur.stake)}</span>{" "}
                  → thắng <span className="font-semibold text-brand">+{fmtNum(payout(cur.stake, mk.odds))}</span>{" "}
                  · thua <span className="font-semibold text-danger">−{fmtNum(cur.stake)}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-surface/95 px-5 py-3 text-center text-xs text-muted backdrop-blur">
        Lựa chọn được lưu tự động. Đặt thoải mái trong số điểm đang có — thắng theo tỉ lệ, thua mất mức đặt.
      </div>
    </Modal>
  );
}

function ExactScorePicker({
  match,
  current,
  stake,
  canAfford,
}: {
  match: Match;
  current?: Prediction;
  stake: number;
  canAfford: (want: number, cur?: Prediction) => boolean;
}) {
  const toast = useToast();
  const [h, a] = (current?.value ?? "-").split("-");
  const [home, setHome] = useState(h && h !== "" ? h : "");
  const [away, setAway] = useState(a && a !== "" ? a : "");

  const save = (nh: string, na: string) => {
    if (nh !== "" && na !== "") {
      if (!canAfford(stake, current)) return;
      placePrediction(match.id, "exact", `${nh}-${na}`, stake);
      toast({
        title: "Đã lưu tỉ số dự đoán 🎯",
        description: `${nh} – ${na} · đặt ${fmtNum(stake)}`,
        variant: "success",
      });
    }
  };

  const num = (v: string) => Math.max(0, Math.min(20, parseInt(v || "0", 10) || 0));

  return (
    <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-surface-2/50 py-3">
      <input
        type="number"
        min={0}
        max={20}
        inputMode="numeric"
        aria-label="Bàn thắng đội nhà"
        value={home}
        onChange={(e) => {
          const v = String(num(e.target.value));
          setHome(v);
          save(v, away);
        }}
        className="h-12 w-14 rounded-lg border border-border bg-background text-center text-xl font-bold focus:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
      <span className="text-xl font-bold text-muted">–</span>
      <input
        type="number"
        min={0}
        max={20}
        inputMode="numeric"
        aria-label="Bàn thắng đội khách"
        value={away}
        onChange={(e) => {
          const v = String(num(e.target.value));
          setAway(v);
          save(home, v);
        }}
        className="h-12 w-14 rounded-lg border border-border bg-background text-center text-xl font-bold focus:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
    </div>
  );
}
