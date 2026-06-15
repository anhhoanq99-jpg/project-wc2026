import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { verifyPassword, createSession } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password)
    return NextResponse.json({ error: "Thiếu email hoặc mật khẩu" }, { status: 400 });

  try {
    const db = await getDb();
    const r = await db.execute({
      sql: "select id, email, password, name, avatar, favorite_team from users where email=?",
      args: [email],
    });
    const u = r.rows[0];
    if (!u || !verifyPassword(password, u.password as string))
      return NextResponse.json({ error: "Email hoặc mật khẩu sai" }, { status: 401 });

    await createSession(u.id as string);
    return NextResponse.json({
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        avatar: u.avatar,
        favoriteTeam: u.favorite_team,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Lỗi máy chủ/CSDL", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
