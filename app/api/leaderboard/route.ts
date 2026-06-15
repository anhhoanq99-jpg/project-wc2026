import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { buildMergedMatches } from "@/lib/data/provider";
import { totalPoints, type Prediction } from "@/lib/scoring";
import type { MarketId } from "@/lib/data/markets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bảng xếp hạng tất cả người đã ĐĂNG KÝ, tính điểm từ dự đoán + kết quả thật. */
export async function GET() {
  const me = await getSessionUser();
  const [matches, db] = await Promise.all([buildMergedMatches(), getDb()]);
  const matchMap = new Map(matches.map((m) => [m.id, m]));

  const usersRes = await db.execute("select id, name, avatar from users");
  const predsRes = await db.execute(
    "select user_id, match_id, market, value, created_at from predictions",
  );

  const byUser = new Map<string, Prediction[]>();
  for (const r of predsRes.rows) {
    const uid = r.user_id as string;
    const arr = byUser.get(uid) ?? [];
    arr.push({
      matchId: r.match_id as string,
      market: r.market as MarketId,
      value: r.value as string,
      createdAt: Number(r.created_at),
    });
    byUser.set(uid, arr);
  }

  const rows = usersRes.rows
    .map((u) => {
      const st = totalPoints(byUser.get(u.id as string) ?? [], matchMap);
      return {
        id: u.id as string,
        name: u.name as string,
        avatar: (u.avatar as string) ?? "",
        total: st.total,
        correct: st.correct,
        wrong: st.wrong,
        me: me?.id === u.id,
      };
    })
    .sort((a, b) => b.total - a.total);

  return NextResponse.json(
    { rows, meId: me?.id ?? null },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" } },
  );
}
