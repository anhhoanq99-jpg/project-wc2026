import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TẠM THỜI: cộng điểm thưởng (bonus) cho một người dùng theo id.
 * Yêu cầu header `x-admin-key` khớp env ADMIN_KEY. Sẽ gỡ sau khi dùng.
 */
export async function POST(req: Request) {
  const key = process.env.ADMIN_KEY;
  if (!key || req.headers.get("x-admin-key") !== key) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    userId?: string;
    amount?: number;
    reason?: string;
  };
  const amount = Math.trunc(Number(body.amount));
  if (!body.userId || !Number.isFinite(amount) || amount === 0) {
    return NextResponse.json({ error: "userId và amount là bắt buộc" }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.execute({
    sql: "select id, name from users where id = ?",
    args: [body.userId],
  });
  if (user.rows.length === 0) {
    return NextResponse.json({ error: "không tìm thấy người dùng" }, { status: 404 });
  }

  await db.execute({
    sql: "insert into bonuses (id, user_id, amount, reason, created_at) values (?, ?, ?, ?, ?)",
    args: [randomUUID(), body.userId, amount, body.reason ?? "", Date.now()],
  });

  const sum = await db.execute({
    sql: "select sum(amount) as total from bonuses where user_id = ?",
    args: [body.userId],
  });

  return NextResponse.json({
    ok: true,
    user: user.rows[0],
    granted: amount,
    totalBonus: Number(sum.rows[0].total) || 0,
  });
}
