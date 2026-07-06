"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin, Lock, PencilLine, Trophy, Heart, Tv, ExternalLink } from "lucide-react";
import type { Match, Goal } from "@/lib/types";
import { getTeam } from "@/lib/data/teams";
import { channelForMatch } from "@/lib/data/channels";
import { vnTime } from "@/lib/tz";
import { MARKET_MAP, selectionLabel } from "@/lib/data/markets";
import { scorePrediction } from "@/lib/scoring";
import { fmtDelta, fmtDeltaShort } from "@/lib/format";
import { usePredictions, useProfile } from "@/components/use-store";
import { PredictionSheet } from "@/components/prediction-sheet";
import { Flag } from "@/components/flag";
import { cn } from "@/lib/utils";

/** Tên vòng đấu hiển thị trên thẻ trận knock-out. */
const STAGE_LABELS: Record<string, string> = {
  r32: "Vòng 1/16",
  r16: "Vòng 1/8",
  qf: "Tứ kết",
  sf: "Bán kết",
  third: "Tranh hạng ba",
  final: "Chung kết",
};

export function MatchCard({ match }: { match: Match }) {
  const [open, setOpen] = useState(false);
  const preds = usePredictions();
  const profile = useProfile();
  const home = getTeam(match.homeCode);
  const away = getTeam(match.awayCode);

  const fav = profile.favoriteTeam;
  const hasFav = fav === match.homeCode || fav === match.awayCode;

  const myPreds = preds.filter((p) => p.matchId === match.id);
  // Chưa chốt đủ 2 đội (nhánh knock-out "Thắng trận N") -> chưa cho dự đoán.
  const teamsKnown =
    !/^[WL]\d+$/.test(match.homeCode) && !/^[WL]\d+$/.test(match.awayCode);
  const canPredict = match.status === "upcoming" && teamsKnown;

  const earned = myPreds.reduce((s, p) => s + scorePrediction(p, match).delta, 0);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "rounded-xl border bg-surface/70 p-4 transition-colors hover:border-brand/40",
        hasFav ? "border-live/50 ring-1 ring-live/20" : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span className="flex min-w-0 items-center gap-2">
          <StatusBadge match={match} />
          {match.group ? (
            <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 font-medium">
              Bảng {match.group}
            </span>
          ) : (
            <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 font-medium text-accent">
              {STAGE_LABELS[match.stage] ?? match.stage}
            </span>
          )}
          <span className="hidden items-center gap-1 truncate sm:inline-flex">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {match.venue}
          </span>
        </span>
        {match.status !== "finished" && <WatchChip match={match} />}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamSide code={match.homeCode} name={home.name} align="right" fav={fav === match.homeCode} />
        <ScoreBox match={match} />
        <TeamSide code={match.awayCode} name={away.name} align="left" fav={fav === match.awayCode} />
      </div>

      {(match.status === "finished" || match.status === "live") &&
        ((match.goals && match.goals.length > 0) ||
          (match.homeScore ?? 0) + (match.awayScore ?? 0) > 0) && (
          <GoalsRow match={match} goals={match.goals ?? []} />
        )}

      {/* khu vực dự đoán */}
      <div className="mt-3 border-t border-border/70 pt-3">
        {myPreds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {myPreds.map((p) => {
              const r = scorePrediction(p, match);
              return (
                <span
                  key={p.market}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    !r.settled
                      ? "bg-surface-2 text-muted"
                      : r.correct
                        ? "bg-brand/15 text-brand"
                        : "bg-danger/15 text-danger",
                  )}
                >
                  {MARKET_MAP[p.market].short}: {selectionLabel(match, p.market, p.value)}
                  {r.settled && ` ${fmtDeltaShort(r.delta)}`}
                </span>
              );
            })}
            {match.status === "finished" && (
              <span
                className={cn(
                  "ml-auto inline-flex items-center gap-1 text-xs font-bold",
                  earned >= 0 ? "text-brand" : "text-danger",
                )}
              >
                <Trophy className="h-3.5 w-3.5" />
                {fmtDelta(earned)}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted">Chưa dự đoán trận này.</p>
        )}

        {canPredict ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => setOpen(true)}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand/15 px-3 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <PencilLine className="h-4 w-4" />
            {myPreds.length > 0 ? "Sửa dự đoán" : "Dự đoán ngay"}
          </motion.button>
        ) : (
          <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-muted">
            <Lock className="h-3.5 w-3.5" />
            {match.status === "live"
              ? "Đang đá — đã khoá dự đoán"
              : match.status === "finished"
                ? "Đã kết thúc"
                : "Chờ xác định 2 đội"}
          </p>
        )}
      </div>

      <AnimatePresence>
        {open && <PredictionSheet match={match} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function WatchChip({ match }: { match: Match }) {
  const ch = channelForMatch(match.id);
  const live = match.status === "live";
  return (
    <a
      href={ch.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={`Xem ${ch.name} trên VTVGo (bản quyền)`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        live
          ? "border-live/40 bg-live/15 text-live"
          : "border-border bg-surface hover:border-brand/50 hover:text-brand",
      )}
    >
      {live ? (
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
      ) : (
        <Tv className="h-3 w-3" />
      )}
      {ch.name}
      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
    </a>
  );
}

function TeamSide({
  code,
  name,
  fav = false,
}: {
  code: string;
  name: string;
  align?: "left" | "right";
  fav?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <Flag code={code} size={48} className="!rounded-md shadow-sm" />
      <span className="text-sm font-semibold leading-tight">
        {name}
        {fav && <Heart className="ml-1 inline h-3.5 w-3.5 fill-live text-live align-baseline" />}
      </span>
    </div>
  );
}

function GoalsRow({ match, goals }: { match: Match; goals: Goal[] }) {
  const home = goals.filter((g) => g.side === "home");
  const away = goals.filter((g) => g.side === "away");
  // Nguồn dữ liệu đôi khi thiếu cầu thủ ghi bàn so với tỉ số -> bù dòng "chưa rõ".
  const homeUnknown = Math.max(0, (match.homeScore ?? 0) - home.length);
  const awayUnknown = Math.max(0, (match.awayScore ?? 0) - away.length);
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-3 rounded-lg bg-surface-2/40 px-3 py-2 text-xs">
      <ul className="space-y-0.5">
        {home.map((g, i) => (
          <GoalLine key={i} g={g} align="right" />
        ))}
        {homeUnknown > 0 && <UnknownGoal count={homeUnknown} align="right" />}
      </ul>
      <ul className="space-y-0.5">
        {away.map((g, i) => (
          <GoalLine key={i} g={g} align="left" />
        ))}
        {awayUnknown > 0 && <UnknownGoal count={awayUnknown} align="left" />}
      </ul>
    </div>
  );
}

function UnknownGoal({ count, align }: { count: number; align: "left" | "right" }) {
  return (
    <li
      className={cn(
        "flex items-center gap-1 italic text-muted/80",
        align === "right" ? "flex-row-reverse text-right" : "text-left",
      )}
    >
      <span aria-hidden>⚽</span>
      <span>
        {count} bàn — chưa rõ cầu thủ
      </span>
    </li>
  );
}

function GoalLine({ g, align }: { g: Goal; align: "left" | "right" }) {
  const tag = g.kind === "penalty" ? " (pen)" : g.kind === "own" ? " (phản)" : "";
  return (
    <li
      className={cn(
        "flex items-center gap-1",
        align === "right" ? "flex-row-reverse text-right" : "text-left",
      )}
    >
      <span aria-hidden>⚽</span>
      <span className="text-muted">
        <span className="font-medium text-foreground">{g.player}</span> {g.minute}&apos;
        {tag}
      </span>
    </li>
  );
}

function ScoreBox({ match }: { match: Match }) {
  if (match.status === "upcoming") {
    return (
      <div className="rounded-lg bg-surface-2 px-3 py-1.5 text-center">
        <p className="flex items-center gap-1 text-sm font-bold">
          <Clock className="h-3.5 w-3.5 text-muted" />
          {vnTime(match.kickoff)}
        </p>
      </div>
    );
  }

  const hasScore =
    typeof match.homeScore === "number" && typeof match.awayScore === "number";

  return (
    <div
      className={cn(
        "min-w-[64px] rounded-lg px-3 py-1.5 text-center",
        match.status === "live" ? "bg-live/15" : "bg-surface-2",
      )}
    >
      {hasScore ? (
        <>
          <p className="text-xl font-extrabold tabular-nums">
            {match.homeScore} <span className="text-muted">–</span> {match.awayScore}
          </p>
          {match.homePens != null && match.awayPens != null && (
            <p className="text-[10px] font-semibold text-muted">
              Luân lưu {match.homePens}–{match.awayPens}
            </p>
          )}
        </>
      ) : (
        <p className="text-xs font-semibold text-muted">
          {match.status === "live" ? "Đang đá" : "Đang cập nhật"}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ match }: { match: Match }) {
  if (match.status === "live")
    return (
      <span className="inline-flex items-center gap-1.5 font-bold text-live">
        <span className="live-dot h-2 w-2 rounded-full bg-live" />
        LIVE {match.minute ? `${match.minute}'` : ""}
      </span>
    );
  if (match.status === "finished")
    return <span className="font-bold text-muted">Kết thúc</span>;
  return <span className="font-medium text-brand">Sắp đá</span>;
}
