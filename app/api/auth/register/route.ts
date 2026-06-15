import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { hashPassword, createSession, newId } from "@/lib/server/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  email?: string;
  password?: string;
  name?: string;
  avatar?: string;
  favoriteTeam?: string;
  predictions?: { matchId: string; market: string; value: string }[];
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim().slice(0, 24);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
  if (password.length < 6)
    return NextResponse.json({ error: "Mật khẩu tối thiểu 6 ký tự" }, { status: 400 });
  if (name.length < 2)
    return NextResponse.json({ error: "Tên tối thiểu 2 ký tự" }, { status: 400 });

  try {
    const db = await getDb();
    const exists = await db.execute({ sql: "select id from users where email=?", args: [email] });
    if (exists.rows[0])
      return NextResponse.json({ error: "Email đã được đăng ký" }, { status: 409 });

    const id = newId();
    await db.execute({
      sql: "insert into users(id,email,password,name,avatar,favorite_team,created_at) values(?,?,?,?,?,?,?)",
      args: [
        id,
        email,
        hashPassword(password),
        name,
        (body.avatar ?? "").slice(0, 8),
        (body.favoriteTeam ?? "").slice(0, 8),
        Date.now(),
      ],
    });

    // Mang theo dự đoán đã chơi ẩn danh (nếu có) vào tài khoản.
    const local = Array.isArray(body.predictions) ? body.predictions.slice(0, 500) : [];
    for (const p of local) {
      if (!p?.matchId || !p?.market || !p?.value) continue;
      await db.execute({
        sql: `insert into predictions(user_id,match_id,market,value,created_at) values(?,?,?,?,?)
              on conflict(user_id,match_id,market) do update set value=excluded.value`,
        args: [id, p.matchId, p.market, p.value, Date.now()],
      });
    }

    await createSession(id);
    return NextResponse.json({
      user: { id, email, name, avatar: body.avatar ?? "", favoriteTeam: body.favoriteTeam ?? "" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Lỗi máy chủ/CSDL", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
