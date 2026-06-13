"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Filter } from "lucide-react";
import type { Match } from "@/lib/types";
import { useMatches } from "@/components/use-matches";
import { vnDayKey, vnRelativeDay, vnTodayKey } from "@/lib/tz";
import { MatchCard } from "@/components/match-card";
import { cn } from "@/lib/utils";

/** Lịch thi đấu đầy đủ, nhóm theo ngày (giờ VN), lọc theo trạng thái. */
export function ScheduleList() {
  const matches = useMatches();
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "finished">("all");

  const days = useMemo(() => {
    if (!matches) return [];
    const filtered =
      filter === "all" ? matches : matches.filter((m) => m.status === filter);
    const byDay = new Map<string, Match[]>();
    for (const m of filtered) {
      const k = vnDayKey(m.kickoff);
      (byDay.get(k) ?? byDay.set(k, []).get(k)!).push(m);
    }
    return [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, list]) => ({
        key,
        list: list.sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
      }));
  }, [matches, filter]);

  const today = vnTodayKey();

  if (!matches) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-surface-2/60" />
        ))}
      </div>
    );
  }

  const FILTERS = [
    { id: "all", label: "Tất cả" },
    { id: "live", label: "Đang đá" },
    { id: "upcoming", label: "Sắp đá" },
    { id: "finished", label: "Đã đá" },
  ] as const;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto">
        <Filter className="h-4 w-4 shrink-0 text-muted" />
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.id
                ? "bg-brand text-[#04130b]"
                : "border border-border text-muted hover:bg-surface",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {days.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface/70 p-6 text-center text-muted">
          Không có trận nào ở bộ lọc này.
        </p>
      ) : (
        <div className="space-y-8">
          {days.map(({ key, list }) => (
            <div key={key}>
              <h3
                className={cn(
                  "mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide",
                  key === today ? "text-brand" : "text-muted",
                )}
              >
                <CalendarDays className="h-4 w-4" />
                {vnRelativeDay(list[0].kickoff)}
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs font-normal normal-case">{list.length} trận</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {list.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
