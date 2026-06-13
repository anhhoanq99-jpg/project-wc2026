"use client";

import { CalendarDays, BellRing, Sunrise } from "lucide-react";
import type { Match } from "@/lib/types";
import { useMatches } from "@/components/use-matches";
import { vnDayKey, vnTodayKey, vnDateLabel, vnRelativeDay } from "@/lib/tz";
import { MatchCard } from "@/components/match-card";

const ORDER: Record<Match["status"], number> = { live: 0, upcoming: 1, finished: 2 };

function sortMatches(list: Match[]) {
  return [...list].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || a.kickoff.localeCompare(b.kickoff),
  );
}

/** Phần GHIM ĐẦU TRANG: trận hôm nay + trận ngày mai để nhắc nhở. */
export function TodayBoard() {
  const matches = useMatches();
  if (!matches) return <BoardSkeleton />;

  const todayKey = vnTodayKey();
  const dayKeys = [...new Set(matches.map((m) => vnDayKey(m.kickoff)))].sort();

  // Ngày chính = hôm nay, nếu hôm nay trống thì ngày thi đấu gần nhất sắp tới.
  const primaryKey = dayKeys.find((k) => k >= todayKey) ?? dayKeys[dayKeys.length - 1];
  const secondaryKey = dayKeys.find((k) => k > primaryKey);

  const primary = sortMatches(matches.filter((m) => vnDayKey(m.kickoff) === primaryKey));
  const secondary = secondaryKey
    ? sortMatches(matches.filter((m) => vnDayKey(m.kickoff) === secondaryKey))
    : [];

  return (
    <section id="hom-nay" className="scroll-mt-20 space-y-5">
      <DayBlock
        matches={primary}
        primary
        title={primaryKey === todayKey ? "Trận hôm nay" : "Ngày thi đấu sắp tới"}
        dateLabel={
          primaryKey === todayKey
            ? `Hôm nay · ${vnDateLabel(new Date())}`
            : vnDateLabel(primary[0]?.kickoff ?? new Date())
        }
      />
      {secondary.length > 0 && (
        <DayBlock
          matches={secondary}
          title={vnRelativeDay(secondary[0].kickoff)}
          dateLabel={vnDateLabel(secondary[0].kickoff)}
        />
      )}
    </section>
  );
}

function DayBlock({
  matches,
  title,
  dateLabel,
  primary = false,
}: {
  matches: Match[];
  title: string;
  dateLabel: string;
  primary?: boolean;
}) {
  const liveCount = matches.filter((m) => m.status === "live").length;

  return (
    <div
      className={
        primary
          ? "rounded-2xl border border-brand/30 bg-gradient-to-b from-brand/10 to-transparent p-5 sm:p-6"
          : "rounded-2xl border border-border bg-surface/40 p-5 sm:p-6"
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={
              primary
                ? "grid h-9 w-9 place-items-center rounded-lg bg-brand/20 text-brand"
                : "grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-accent"
            }
          >
            {primary ? <BellRing className="h-5 w-5" /> : <Sunrise className="h-5 w-5" />}
          </span>
          <div>
            <h2 className="text-lg font-extrabold leading-tight sm:text-xl">
              {primary ? "⚽ " : "📅 "}
              {title}
            </h2>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <CalendarDays className="h-3.5 w-3.5" />
              {dateLabel} · giờ Việt Nam
            </p>
          </div>
        </div>
        {liveCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-live/15 px-3 py-1 text-sm font-bold text-live">
            <span className="live-dot h-2 w-2 rounded-full bg-live" />
            {liveCount} trận đang đá
          </span>
        )}
      </div>

      {matches.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface/70 p-6 text-center text-muted">
          Không có trận nào. Kéo xuống xem lịch các ngày tới nhé!
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function BoardSkeleton() {
  return (
    <section className="rounded-2xl border border-brand/30 bg-brand/5 p-6">
      <div className="mb-4 h-6 w-40 animate-pulse rounded bg-surface-2" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-surface-2/60" />
        ))}
      </div>
    </section>
  );
}
