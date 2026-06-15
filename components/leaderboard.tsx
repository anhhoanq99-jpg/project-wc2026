"use client";

import { useEffect, useState } from "react";
import { Crown, UserRound, LogIn, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtWC } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  name: string;
  avatar: string;
  total: number;
  correct: number;
  wrong: number;
  me: boolean;
}

export function Leaderboard() {
  const { status } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        const json = (await res.json()) as { rows: Row[] };
        if (alive) {
          setRows(json.rows ?? []);
          setLoading(false);
        }
      } catch {
        if (alive) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [status]);

  const myRank = rows.findIndex((r) => r.me);

  return (
    <div>
      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted">
        <RefreshCw className="h-3 w-3" />
        Xếp hạng người chơi đã đăng ký · tự cập nhật
      </p>

      {status === "anon" && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 p-4 text-sm">
          <LogIn className="h-5 w-5 shrink-0 text-brand" />
          <span>
            <strong>Đăng nhập / đăng ký</strong> (góc trên bên phải) để tên bạn xuất hiện
            trên bảng xếp hạng và lưu điểm vĩnh viễn.
          </span>
        </div>
      )}

      {myRank >= 0 && (
        <div className="mb-5 rounded-xl border border-brand/30 bg-brand/10 p-4 text-center">
          <p className="text-sm text-muted">Hạng của bạn</p>
          <p className="text-3xl font-extrabold text-brand">
            #{myRank + 1}
            <span className="ml-2 text-base font-semibold text-foreground">
              · {fmtWC(rows[myRank].total)}
            </span>
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface/70 p-6 text-center text-muted">
          Chưa có người chơi nào đăng ký. Hãy là người đầu tiên!
        </p>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3",
                r.me ? "border-brand bg-brand/10" : "border-border bg-surface/70",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-extrabold",
                  i === 0 ? "bg-accent/20 text-accent" : "bg-surface-2 text-muted",
                )}
              >
                {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-lg">
                {r.avatar || <UserRound className="h-4 w-4 text-muted" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {r.name}
                  {r.me && <span className="ml-2 text-xs text-brand">(bạn)</span>}
                </span>
                <span className="text-xs text-muted">
                  Đúng {r.correct} · Sai {r.wrong}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 text-right font-extrabold tabular-nums",
                  r.total < 0 ? "text-danger" : "text-accent",
                )}
              >
                {fmtWC(r.total)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
