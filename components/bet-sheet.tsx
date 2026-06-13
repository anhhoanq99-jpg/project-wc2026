"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Check, Trophy } from "lucide-react";
import type { Match } from "@/lib/types";
import { MARKETS, type MarketId } from "@/lib/data/bets";
import { getTeam } from "@/lib/data/teams";
import { fmtDeltaShort } from "@/lib/format";
import { placePrediction, removePrediction } from "@/lib/storage";
import { usePredictions } from "@/components/use-store";
import { Flag } from "@/components/flag";
import { cn } from "@/lib/utils";

export function BetSheet({ match, onClose }: { match: Match; onClose: () => void }) {
  const preds = usePredictions();
  const home = getTeam(match.homeCode);
  const away = getTeam(match.awayCode);

  // đóng bằng phím Esc
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const picked = (market: MarketId) =>
    preds.find((p) => p.matchId === match.id && p.market === market)?.value;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 28, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 28, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-surface/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Dự đoán vui · điểm ảo
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {MARKETS.map((mk) => (
            <div key={mk.id}>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{mk.name}</p>
                  <p className="text-xs text-muted">{mk.desc}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold">
                  <span className="text-brand">{fmtDeltaShort(mk.points)}</span>
                  <span className="text-muted">/</span>
                  <span className="text-danger">{fmtDeltaShort(-mk.stake)}</span>
                </span>
              </div>

              {mk.id === "exact" ? (
                <ExactScorePicker match={match} current={picked("exact")} />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {mk.options(match).map((o) => {
                    const active = picked(mk.id) === o.value;
                    return (
                      <motion.button
                        key={o.value}
                        type="button"
                        whileTap={{ scale: 0.94 }}
                        onClick={() =>
                          active
                            ? removePrediction(match.id, mk.id)
                            : placePrediction(match.id, mk.id, o.value)
                        }
                        className={cn(
                          "rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors",
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
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 border-t border-border bg-surface/95 px-5 py-3 text-center text-xs text-muted backdrop-blur">
          Lựa chọn được lưu tự động trên máy bạn. Chốt trước giờ bóng lăn nhé!
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function ExactScorePicker({ match, current }: { match: Match; current?: string }) {
  const [h, a] = (current ?? "-").split("-");
  const [home, setHome] = useState(h && h !== "" ? h : "");
  const [away, setAway] = useState(a && a !== "" ? a : "");

  const save = (nh: string, na: string) => {
    if (nh !== "" && na !== "") placePrediction(match.id, "exact", `${nh}-${na}`);
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
        className="h-12 w-14 rounded-lg border border-border bg-background text-center text-xl font-bold focus:border-brand focus:outline-none"
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
        className="h-12 w-14 rounded-lg border border-border bg-background text-center text-xl font-bold focus:border-brand focus:outline-none"
      />
    </div>
  );
}
