import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TẠM THỜI: xóa toàn bộ dữ liệu người chơi (users, sessions, predictions,
 * bonuses) khi đóng trang sau World Cup. Yêu cầu header `x-admin-key` khớp
 * env ADMIN_KEY. Sẽ gỡ sau khi dùng.
 */
export async function POST(req: Request) {
  const key = process.env.ADMIN_KEY;
  if (!key || req.headers.get("x-admin-key") !== key) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const counts: Record<string, number> = {};
  for (const table of ["users", "sessions", "predictions", "bonuses"]) {
    const r = await db.execute(`select count(*) as n from ${table}`);
    counts[table] = Number(r.rows[0].n) || 0;
  }

  await db.batch(
    [
      "delete from predictions",
      "delete from bonuses",
      "delete from sessions",
      "delete from users",
    ],
    "write",
  );

  return NextResponse.json({ ok: true, deleted: counts });
}
