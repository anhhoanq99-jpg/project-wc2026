"use client";

import { useMemo } from "react";
import { Award, Star } from "lucide-react";
import { usePredictions } from "@/components/use-store";
import { useMatches } from "@/components/use-matches";
import { computeAnalytics, type PlayerRating as Rating } from "@/lib/analytics";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

/** Thẻ "Đánh giá người chơi" (hạng sao + nhận xét + tỉ lệ thắng). Dùng chung. */
export function RatingCard({ rating, winRate }: { rating: Rating; winRate: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/15 via-surface/40 to-transparent p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
            <Award className="h-3.5 w-3.5" />
            Đánh giá người chơi
          </p>
          <h2 className="mt-1 text-2xl font-extrabold">{rating.title}</h2>
          <div className="mt-1 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  "h-5 w-5",
                  s <= rating.stars ? "fill-accent text-accent" : "text-border",
                )}
              />
            ))}
          </div>
          <p className="mt-2 max-w-md text-sm text-muted">{rating.desc}</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-extrabold tabular-nums text-brand">
            {Math.round(winRate * 100)}%
          </p>
          <p className="text-xs text-muted">Tỉ lệ thắng</p>
        </div>
      </div>
    </div>
  );
}

/** Bản dùng ở TRANG CHỦ: tự tính từ dự đoán; chỉ hiện khi đã có dự đoán. */
export function PlayerRating() {
  const preds = usePredictions();
  const matches = useMatches();
  const a = useMemo(() => {
    const map = new Map((matches ?? []).map((m) => [m.id, m]));
    return computeAnalytics(preds, map);
  }, [preds, matches]);

  if (preds.length === 0) return null;

  return (
    <Reveal>
      <RatingCard rating={a.rating} winRate={a.winRate} />
    </Reveal>
  );
}
