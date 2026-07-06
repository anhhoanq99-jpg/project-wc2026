"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { TrophyCup } from "@/components/trophy-cup";
import { Flag } from "@/components/flag";
import { getTeam } from "@/lib/data/teams";
import type { BracketData, KnockoutTie, RoundKey } from "@/lib/data/provider";
import { cn } from "@/lib/utils";

const ROUNDS: { key: RoundKey; name: string; count: number }[] = [
  { key: "r32", name: "Vòng 1/16", count: 16 },
  { key: "r16", name: "Vòng 1/8", count: 8 },
  { key: "qf", name: "Tứ kết", count: 4 },
  { key: "sf", name: "Bán kết", count: 2 },
  { key: "final", name: "Chung kết", count: 1 },
];

const EMPTY: BracketData = {
  rounds: { r32: [], r16: [], qf: [], sf: [], third: [], final: [] },
  champion: null,
};

/** Đội thắng một nhánh (tính cả luân lưu); null nếu chưa xong. */
function winnerOf(tie?: KnockoutTie): string | null {
  if (!tie || tie.status !== "finished" || tie.homeScore == null || tie.awayScore == null)
    return null;
  if (tie.homeScore !== tie.awayScore)
    return tie.homeScore > tie.awayScore ? tie.homeCode : tie.awayCode;
  if (tie.homePens != null && tie.awayPens != null && tie.homePens !== tie.awayPens)
    return tie.homePens > tie.awayPens ? tie.homeCode : tie.awayCode;
  return null;
}

export function Bracket() {
  const [data, setData] = useState<BracketData>(EMPTY);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/bracket", { cache: "no-store" });
        if (res.ok && alive) setData((await res.json()) as BracketData);
      } catch {}
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div>
      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted">
        <RefreshCw className="h-3 w-3" />
        Tự cập nhật theo kết quả thật
      </p>

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-5">
          {ROUNDS.map((r) => {
            const ties = data.rounds[r.key] ?? [];
            return (
              <div key={r.key} className="flex w-48 flex-col">
                <div className="mb-3 rounded-lg bg-surface px-3 py-2 text-center text-sm font-bold">
                  {r.name}
                  <span className="ml-1 text-xs font-normal text-muted">({r.count})</span>
                </div>
                <div className="flex flex-1 flex-col justify-around gap-3">
                  {Array.from({ length: r.count }, (_, i) => (
                    <TieCard key={i} tie={ties[i]} highlight={r.key === "final"} />
                  ))}

                  {/* Trận tranh hạng ba nằm dưới chung kết */}
                  {r.key === "final" && (
                    <div className="mt-4">
                      <div className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Tranh hạng ba
                      </div>
                      <TieCard tie={(data.rounds.third ?? [])[0]} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Cột nhà vô địch */}
          <div className="flex w-48 flex-col">
            <div className="mb-3 rounded-lg bg-accent/15 px-3 py-2 text-center text-sm font-bold text-accent">
              Vô địch
            </div>
            <div className="flex flex-1 items-center">
              <div className="w-full rounded-xl border border-accent/40 bg-gradient-to-b from-accent/15 to-transparent p-4 text-center">
                <TrophyCup size={56} className="mx-auto" />
                {data.champion ? (
                  <div className="mt-2 flex items-center justify-center gap-1.5 font-bold">
                    <Flag code={data.champion} size={22} />
                    {getTeam(data.champion).name}
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-sm font-bold">Chờ xác định</p>
                    <p className="text-xs text-muted">Nhà vô địch 2026</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** "10/7" — ngày đá (giờ VN) cho nhánh chưa đá. */
function shortDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(d);
}

function TieCard({ tie, highlight }: { tie?: KnockoutTie; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-surface/70 p-2",
        highlight ? "border-accent/40" : "border-border",
      )}
    >
      <TieSide tie={tie} side="home" />
      <div className="my-1 h-px bg-border" />
      <TieSide tie={tie} side="away" />
      {tie && tie.status !== "finished" && tie.kickoff && (
        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-muted">
          {tie.status === "live" ? (
            <span className="font-bold text-live">● LIVE</span>
          ) : (
            <span>{shortDate(tie.kickoff)}</span>
          )}
        </div>
      )}
    </div>
  );
}

function TieSide({ tie, side }: { tie?: KnockoutTie; side: "home" | "away" }) {
  const code = tie ? (side === "home" ? tie.homeCode : tie.awayCode) : null;
  const score = tie ? (side === "home" ? tie.homeScore : tie.awayScore) : null;
  const pens = tie ? (side === "home" ? tie.homePens : tie.awayPens) : null;
  const win = winnerOf(tie) != null && winnerOf(tie) === code;

  if (!code) {
    return (
      <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted">
        <span className="h-4 w-6 shrink-0 rounded-[3px] bg-surface-2" />
        <span>Chờ…</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-1 py-1 text-xs",
        win ? "font-bold text-foreground" : "text-muted",
      )}
    >
      <Flag code={code} size={18} />
      <span className="flex-1 truncate">{getTeam(code).name}</span>
      {score != null && (
        <span className="tabular-nums">
          {score}
          {pens != null && <span className="text-[10px]"> ({pens})</span>}
        </span>
      )}
    </div>
  );
}
