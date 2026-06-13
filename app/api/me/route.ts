import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      avatar: u.avatar,
      favoriteTeam: u.favorite_team,
    },
  });
}

export async function PUT(req: Request) {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  let body: { name?: string; avatar?: string; favoriteTeam?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const name = body.name !== undefined ? body.name.trim().slice(0, 24) : u.name;
  const avatar = body.avatar !== undefined ? body.avatar.slice(0, 8) : u.avatar;
  const fav =
    body.favoriteTeam !== undefined ? body.favoriteTeam.slice(0, 8) : u.favorite_team;

  const db = await getDb();
  await db.execute({
    sql: "update users set name=?, avatar=?, favorite_team=? where id=?",
    args: [name, avatar, fav, u.id],
  });

  return NextResponse.json({
    user: { id: u.id, email: u.email, name, avatar, favoriteTeam: fav },
  });
}
