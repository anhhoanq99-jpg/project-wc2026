import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ predictions: [] });
  const db = await getDb();
  const r = await db.execute({
    sql: "select match_id, market, value, created_at from predictions where user_id=?",
    args: [u.id],
  });
  return NextResponse.json({
    predictions: r.rows.map((x) => ({
      matchId: x.match_id,
      market: x.market,
      value: x.value,
      createdAt: Number(x.created_at),
    })),
  });
}

export async function PUT(req: Request) {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  let body: { matchId?: string; market?: string; value?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  if (!body.matchId || !body.market || !body.value)
    return NextResponse.json({ error: "Thiếu dữ liệu dự đoán" }, { status: 400 });

  const db = await getDb();
  await db.execute({
    sql: `insert into predictions(user_id,match_id,market,value,created_at) values(?,?,?,?,?)
          on conflict(user_id,match_id,market) do update set value=excluded.value`,
    args: [u.id, body.matchId, body.market, body.value, Date.now()],
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
