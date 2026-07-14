"use client";

import { useState } from "react";
import { UserRound, Pencil, Trophy, Target, Heart, Clock, Fish } from "lucide-react";
import { setName, setFavoriteTeam } from "@/lib/storage";
import { useProfile, usePredictions, useBonus } from "@/components/use-store";
import { useMatches } from "@/components/use-matches";
import { totalPoints } from "@/lib/scoring";
import { getTeam } from "@/lib/data/teams";
import { fmtWC } from "@/lib/format";
import { Flag } from "@/components/flag";
import { TeamPicker } from "@/components/team-picker";
import { cn } from "@/lib/utils";

/** Thanh danh tính: ảnh đại diện + tên + đội yêu thích + tổng điểm. */
export function ProfileBar() {
  const profile = useProfile();
  const preds = usePredictions();
  const matches = useMatches();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [picker, setPicker] = useState(false);

  const bonus = useBonus();
  const map = new Map((matches ?? []).map((m) => [m.id, m]));
  const stats = totalPoints(preds, map, bonus);

  const save = () => {
    if (draft.trim()) setName(draft);
    setEditing(false);
  };

  const name = profile.name || "Khách";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/70 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand/15 text-xl">
          {profile.avatar || <UserRound className="h-5 w-5 text-brand" />}
        </span>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="Nhập tên…"
              maxLength={24}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:border-brand focus:outline-none"
            />
            <button
              onClick={save}
              className="h-9 rounded-lg bg-brand px-3 text-sm font-semibold text-brand-foreground"
            >
              Lưu
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => {
                setDraft(profile.name);
                setEditing(true);
              }}
              className="inline-flex items-center gap-1.5 font-bold hover:text-brand"
            >
              {name}
              <Pencil className="h-3.5 w-3.5 text-muted" />
            </button>
            <button
              onClick={() => setPicker(true)}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
            >
              <Heart className="h-3 w-3 text-live" />
              {profile.favoriteTeam ? (
                <>
                  <Flag code={profile.favoriteTeam} size={14} />
                  {getTeam(profile.favoriteTeam).name}
                </>
              ) : (
                "Chọn đội yêu thích"
              )}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Stat
          icon={<Fish className="h-4 w-4 text-brand" />}
          label="Điểm thưởng"
          value={fmtWC(stats.balance)}
        />
        <Stat
          icon={<Trophy className="h-4 w-4 text-accent" />}
          label="Tổng điểm"
          value={fmtWC(stats.total)}
          className={stats.total < 0 ? "text-danger" : undefined}
        />
        <Stat
          icon={<Target className="h-4 w-4 text-brand" />}
          label="Đúng/Sai"
          value={`${stats.correct}/${stats.wrong}`}
        />
        {stats.pending > 0 && (
          <Stat
            icon={<Clock className="h-4 w-4 text-muted" />}
            label="Đang chờ"
            value={stats.pending}
          />
        )}
      </div>

      {picker && (
        <TeamPicker
          value={profile.favoriteTeam}
          onPick={(c) => {
            setFavoriteTeam(c);
            setPicker(false);
          }}
          onClose={() => setPicker(false)}
        />
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="text-center">
      <p
        className={cn(
          "flex items-center justify-center gap-1 text-base font-extrabold tabular-nums",
          className,
        )}
      >
        {icon}
        {value}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
