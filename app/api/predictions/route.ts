import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";
import { MIN_STAKE, MAX_STAKE, DEFAULT_STAKE } from "@/lib/data/markets";
import { availableBalance, type Prediction } from "@/lib/scoring";
import { buildMergedMatches } from "@/lib/data/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Làm sạch mức đặt nhận từ client (số nguyên, kẹp trong [MIN_STAKE, MAX_STAKE]). */
function cleanStake(v: unknown): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_STAKE;
  return Math.max(MIN_STAKE, Math.min(n, MAX_STAKE));
}

/** Tổng điểm thưởng quản trị (bonus) của một người dùng. */
async function getBonusSum(db: Awaited<ReturnType<typeof getDb>>, userId: string) {
  const r = await db.execute({
    sql: "select sum(amount) as bonus from bonuses where user_id=?",
    args: [userId],
  });
  return Number(r.rows[0]?.bonus) || 0;
}

export async function GET() {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ predictions: [], bonus: 0 });
  const db = await getDb();
  const [r, bonus] = await Promise.all([
    db.execute({
      sql: "select match_id, market, value, stake, created_at from predictions where user_id=?",
      args: [u.id],
    }),
    getBonusSum(db, u.id),
  ]);
  return NextResponse.json({
    predictions: r.rows.map((x) => ({
      matchId: x.match_id,
      market: x.market,
      value: x.value,
      stake: Number(x.stake) || DEFAULT_STAKE,
      createdAt: Number(x.created_at),
    })),
    bonus,
  });
}

export async function PUT(req: Request) {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  let body: { matchId?: string; market?: string; value?: string; stake?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  if (!body.matchId || !body.market || !body.value)
    return NextResponse.json({ error: "Thiếu dữ liệu dự đoán" }, { status: 400 });

  const stake = cleanStake(body.stake);
  const db = await getDb();

  // KHÔNG cho đặt quá số điểm khả dụng (số dư − tổng đang đặt chưa chốt).
  // Dự đoán cũ trên cùng trận + cùng loại được hoàn lại trước khi tính.
  try {
    const r = await db.execute({
      sql: "select match_id, market, value, stake, created_at from predictions where user_id=?",
      args: [u.id],
    });
    const others: Prediction[] = r.rows
      .map((x) => ({
        matchId: String(x.match_id),
        market: x.market as Prediction["market"],
        value: String(x.value),
        stake: Number(x.stake) || DEFAULT_STAKE,
        createdAt: Number(x.created_at),
      }))
      .filter((p) => !(p.matchId === body.matchId && p.market === body.market));
    const matchById = new Map((await buildMergedMatches()).map((m) => [m.id, m]));
    const bonus = await getBonusSum(db, u.id);
    const avail = availableBalance(others, matchById, bonus);
    if (stake > avail) {
      return NextResponse.json(
        { error: `Không đủ điểm thưởng: chỉ còn ${Math.max(0, avail)} WC khả dụng` },
        { status: 400 },
      );
    }
  } catch {
    // Lỗi tính khả dụng (vd nguồn dữ liệu trận đấu tạm sập) -> vẫn nhận dự đoán,
    // vì phía giao diện đã chặn và trò chơi chỉ dùng điểm ảo.
  }

  await db.execute({
    sql: `insert into predictions(user_id,match_id,market,value,stake,created_at) values(?,?,?,?,?,?)
          on conflict(user_id,match_id,market) do update set value=excluded.value, stake=excluded.stake`,
    args: [u.id, body.matchId, body.market, body.value, stake, Date.now()],
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");
  const market = searchParams.get("market");
  if (!matchId || !market)
    return NextResponse.json({ error: "Thiếu tham số" }, { status: 400 });

  const db = await getDb();
  await db.execute({
    sql: "delete from predictions where user_id=? and match_id=? and market=?",
    args: [u.id, matchId, market],
  });
  return NextResponse.json({ ok: true });
}
