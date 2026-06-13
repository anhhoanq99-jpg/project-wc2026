"use client";

import { useState } from "react";
import { Heart, Star, PartyPopper } from "lucide-react";
import { setFavoriteTeam } from "@/lib/storage";
import { useProfile } from "@/components/use-store";
import { useMatches } from "@/components/use-matches";
import { getTeam } from "@/lib/data/teams";
import { Flag } from "@/components/flag";
import { MatchCard } from "@/components/match-card";
import { TeamPicker } from "@/components/team-picker";

/** Mục cá nhân hóa: theo dõi & cổ vũ đội tuyển yêu thích. */
export function MyTeam() {
  const profile = useProfile();
  const matches = useMatches();
  const [picker, setPicker] = useState(false);

  const fav = profile.favoriteTeam;

  // Chưa chọn đội -> mời chọn.
  if (!fav) {
    return (
      <section id="doi-cua-toi" className="scroll-mt-20">
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-8 text-center">
          <Heart className="mx-auto h-8 w-8 text-live" />
          <h2 className="mt-3 text-xl font-extrabold">Chọn đội tuyển yêu thích</h2>
          <p className="mx-auto mt-1 max-w-sm text-muted">
            Theo dõi riêng lịch đấu của đội bạn yêu và cùng cổ vũ họ tới ngôi vô địch.
          </p>
          <button
            onClick={() => setPicker(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 font-semibold text-[#04130b] hover:brightness-110"
          >
            <Star className="h-4 w-4" />
            Chọn đội của tôi
          </button>
        </div>
        {picker && (
          <TeamPicker
            value={fav}
            onPick={(c) => {
              setFavoriteTeam(c);
              setPicker(false);
            }}
            onClose={() => setPicker(false)}
          />
        )}
      </section>
    );
  }

  const team = getTeam(fav);
  const teamMatches = (matches ?? [])
    .filter((m) => m.homeCode === fav || m.awayCode === fav)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  const played = teamMatches.filter((m) => m.status === "finished");
  const wins = played.filter((m) => {
    const us = m.homeCode === fav ? m.homeScore : m.awayScore;
    const them = m.homeCode === fav ? m.awayScore : m.homeScore;
    return us != null && them != null && us > them;
  }).length;

  return (
    <section id="doi-cua-toi" className="scroll-mt-20">
      <div className="overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/15 via-surface/40 to-transparent">
        <div className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
          <Flag code={fav} size={56} className="!rounded-md" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
              <Heart className="h-3.5 w-3.5 fill-current" />
              Đội của tôi
            </p>
            <h2 className="truncate text-2xl font-extrabold">{team.name}</h2>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <PartyPopper className="h-4 w-4 text-accent" />
              Cổ vũ {team.name} vô địch World Cup 2026! 🏆
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xl font-extrabold tabular-nums text-brand">{wins}</p>
              <p className="text-xs text-muted">Thắng</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold tabular-nums">{played.length}</p>
              <p className="text-xs text-muted">Đã đá</p>
            </div>
            <button
              onClick={() => setPicker(true)}
              className="rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface"
            >
              Đổi đội
            </button>
          </div>
        </div>

        {teamMatches.length > 0 && (
          <div className="grid gap-3 border-t border-border/60 p-5 sm:grid-cols-2 sm:p-6">
            {teamMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </div>

      {picker && (
        <TeamPicker
          value={fav}
          onPick={(c) => {
            setFavoriteTeam(c);
            setPicker(false);
          }}
          onClose={() => setPicker(false)}
        />
      )}
    </section>
  );
}
