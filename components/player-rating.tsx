"use client";

import { useMemo } from "react";
import { Award, Star } from "lucide-react";
import { usePredictions } from "@/components/use-store";
import { useMatches } from "@/components/use-matches";
import { computeAnalytics, type PlayerRating as Rating } from "@/lib/analytics";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

/**
 * Thẻ "Đánh giá người chơi" (hạng sao + nhận xét + tỉ lệ thắng). Dùng chung.
 * `compact` = bản nhỏ gọn hơn cho trang chủ.
 */
export function RatingCard({
  rating,
  winRate,
  compact = false,
}: {
  rating: Rating;
  winRate: number;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/15 via-surface/40 to-transparent",
        compact ? "p-4" : "p-6",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
            <Award className="h-3.5 w-3.5" />
            Đánh giá người chơi
          </p>
          <h2 className={cn("mt-1 font-extrabold", compact ? "text-lg" : "text-2xl")}>
            {rating.title}
          </h2>
          <div className="mt-1 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={cn(
                  compact ? "h-4 w-4" : "h-5 w-5",
                  s <= rating.stars ? "fill-accent text-accent" : "text-border",
                )}
              />
            ))}
          </div>
          <p className={cn("mt-2 max-w-md text-muted", compact ? "text-xs" : "text-sm")}>
            {rating.desc}
          </p>
        </div>
        <div className="text-center">
          <p
            className={cn(
              "font-extrabold tabular-nums text-brand",
              compact ? "text-2xl" : "text-4xl",
            )}
          >
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
      <RatingCard rating={a.rating} winRate={a.winRate} compact />
    </Reveal>
  );
}
