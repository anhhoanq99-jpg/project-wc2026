import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

// CHẨN ĐOÁN TẠM THỜI — kiểm tra env + kết nối Turso, KHÔNG lộ secret. Xoá sau khi fix.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rawUrl = process.env.DATABASE_URL ?? "";
  const token = process.env.DATABASE_AUTH_TOKEN ?? "";

  const env = {
    hasUrl: !!rawUrl,
    urlPrefix: rawUrl.slice(0, 18), // vd "libsql://wc2026-an" — đủ để thấy đúng dạng
    urlLen: rawUrl.length,
    urlHasWhitespace: /\s/.test(rawUrl),
    hasToken: !!token,
    tokenLen: token.length,
    tokenLooksJwt: token.startsWith("ey"),
    tokenHasWhitespace: /\s/.test(token),
  };

  let dbCheck: string;
  try {
    const db = await getDb();
    const r = await db.execute("select 1 as ok");
    dbCheck = `OK: ${JSON.stringify(r.rows[0])}`;
  } catch (e) {
    dbCheck = `LỖI: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({ env, dbCheck });
}
