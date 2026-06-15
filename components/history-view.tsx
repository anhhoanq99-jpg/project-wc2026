"use client";

import { useMemo, useState } from "react";
import {
  Star,
  Sparkles,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Flame,
  Award,
  ClipboardList,
} from "lucide-react";
import { usePredictions } from "@/components/use-store";
import { useMatches } from "@/components/use-matches";
import { computeAnalytics, type HistoryItem } from "@/lib/analytics";
import { MARKET_MAP, selectionLabel } from "@/lib/data/markets";
import { getTeam } from "@/lib/data/teams";
import { fmtWC, fmtDelta, fmtDeltaShort } from "@/lib/format";
import { Flag } from "@/components/flag";
import { cn } from "@/lib/utils";

type Filter = "all" | "correct" | "wrong" | "pending";

export function HistoryView() {
  const preds = usePredictions();
  const matches = useMatches();
  const [filter, setFilter] = useState<Filter>("all");

  const a = useMemo(() => {
    const map = new Map((matches ?? []).map((m) => [m.id, m]));
    return computeAnalytics(preds, map);
  }, [preds, matches]);

  if (preds.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center">
        <ClipboardList className="mx-auto h-10 w-10 text-muted" />
        <p className="mt-3 text-lg font-bold">Chưa có lịch sử dự đoán</p>
        <p className="mt-1 text-muted">Hãy dự đoán vài trận để xem thống kê & đánh giá nhé!</p>
      </div>
    );
  }

  const filtered = a.history.filter((h) =>
    filter === "all"
      ? true
      : filter === "pending"
        ? !h.settled
        : filter === "correct"
          ? h.settled && h.correct
          : h.settled && !h.correct,
  );

  return (
    <div className="space-y-8">
      {/* Đánh giá người chơi */}
      <div className="overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/15 via-surface/40 to-transparent p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
              <Award className="h-3.5 w-3.5" />
              Đánh giá người chơi
            </p>
            <h2 className="mt-1 text-2xl font-extrabold">{a.rating.title}</h2>
            <div className="mt-1 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "h-5 w-5",
                    s <= a.rating.stars ? "fill-accent text-accent" : "text-border",
                  )}
                />
              ))}
            </div>
            <p className="mt-2 max-w-md text-sm text-muted">{a.rating.desc}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-extrabold tabular-nums text-brand">
              {Math.round(a.winRate * 100)}%
            </p>
            <p className="text-xs text-muted">Tỉ lệ thắng</p>
          </div>
        </div>
      </div>

      {/* Số liệu chính */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard icon={<Trophy className="h-4 w-4 text-accent" />} label="Tổng điểm" value={fmtWC(a.standing.total)} negative={a.standing.total < 0} />
        <KpiCard icon={<Target className="h-4 w-4 text-brand" />} label="Đúng / Sai" value={`${a.standing.correct} / ${a.standing.wrong}`} />
        <KpiCard icon={<TrendingUp className="h-4 w-4 text-brand" />} label="Tổng thắng" value={fmtWC(a.totalWon)} />
        <KpiCard icon={<TrendingDown className="h-4 w-4 text-danger" />} label="Tổng thua" value={fmtWC(a.totalLost)} />
      </div>

      {/* Nhận xét thông minh */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
          <Sparkles className="h-5 w-5 text-accent" />
          Phân tích thông minh
        </h3>
        <ul className="space-y-2">
          {a.insights.map((t, i) => (
            <li key={i} className="flex items-start gap-2 rounded-xl border border-border bg-surface/60 p-3 text-sm">
              <span className="mt-0.5 text-brand">›</span>
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Dự đoán giỏi nhất */}
      {a.best.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
            <Flame className="h-5 w-5 text-live" />
            Dự đoán giỏi nhất
          </h3>
          <div className="space-y-2">
            {a.best.map((h, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/20 text-sm font-extrabold text-accent">
                  {i + 1}
                </span>
                <MatchMini h={h} />
                <span className="ml-auto shrink-0 font-extrabold text-brand">{fmtDelta(h.delta)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Theo loại dự đoán */}
      {a.byMarket.length > 0 && (
        <section>
          <h3 className="mb-3 text-lg font-extrabold">Hiệu suất theo loại dự đoán</h3>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/60 text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Loại dự đoán</th>
                  <th className="px-3 py-2 text-right font-semibold">Đúng</th>
                  <th className="px-3 py-2 text-right font-semibold">Tỉ lệ</th>
                  <th className="px-3 py-2 text-right font-semibold">Chênh lệch</th>
                </tr>
              </thead>
              <tbody>
                {a.byMarket.map((m) => (
                  <tr key={m.market} className="border-t border-border/60">
                    <td className="px-3 py-2">{m.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{m.correct}/{m.total}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{Math.round(m.winRate * 100)}%</td>
                    <td className={cn("px-3 py-2 text-right font-bold tabular-nums", m.net < 0 ? "text-danger" : "text-brand")}>
                      {fmtDeltaShort(m.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Lịch sử dự đoán */}
      <section>
        <h3 className="mb-3 text-lg font-extrabold">Lịch sử dự đoán ({a.history.length})</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {([
            ["all", "Tất cả"],
            ["correct", "Đúng"],
            ["wrong", "Sai"],
            ["pending", "Đang chờ"],
          ] as [Filter, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                filter === id ? "bg-brand text-brand-foreground" : "border border-border text-muted hover:bg-surface",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface/60 p-6 text-center text-muted">
            Không có mục nào.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((h, i) => (
              <HistoryRow key={i} h={h} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  negative,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-3 text-center">
      <p className={cn("flex items-center justify-center gap-1 text-base font-extrabold tabular-nums", negative && "text-danger")}>
        {icon}
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

function MatchMini({ h }: { h: HistoryItem }) {
  const home = getTeam(h.match.homeCode);
  const away = getTeam(h.match.awayCode);
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
        <Flag code={h.match.homeCode} size={16} />
        {home.name}
        {typeof h.match.homeScore === "number" && (
          <span className="text-muted">
            {h.match.homeScore}–{h.match.awayScore}
          </span>
        )}
        {away.name}
        <Flag code={h.match.awayCode} size={16} />
      </p>
      <p className="truncate text-xs text-muted">
        {MARKET_MAP[h.pred.market].short}: {selectionLabel(h.match, h.pred.market, h.pred.value)}
      </p>
    </div>
  );
}

function HistoryRow({ h }: { h: HistoryItem }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-surface/60 p-3",
        !h.settled ? "border-border" : h.correct ? "border-brand/30" : "border-danger/30",
      )}
    >
      <MatchMini h={h} />
      <span className="ml-auto shrink-0 text-right">
        {!h.settled ? (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">Đang chờ</span>
        ) : (
          <span className={cn("font-extrabold tabular-nums", h.correct ? "text-brand" : "text-danger")}>
            {fmtDeltaShort(h.delta)}
          </span>
        )}
      </span>
    </div>
  );
}
