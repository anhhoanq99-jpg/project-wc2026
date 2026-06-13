import "server-only";
import { scryptSync, randomBytes, timingSafeEqual, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/server/db";

const COOKIE = "wc_session";
const SESSION_DAYS = 60;

export interface DbUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  favorite_team: string;
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = scryptSync(pw, salt, 64);
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function newId(): string {
  return randomUUID();
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  const db = await getDb();
  await db.execute({
    sql: "insert into sessions(token, user_id, expires_at) values(?,?,?)",
    args: [token, userId, expires],
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.execute({ sql: "delete from sessions where token=?", args: [token] });
  }
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<DbUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const s = await db.execute({
    sql: "select user_id, expires_at from sessions where token=?",
    args: [token],
  });
  const sess = s.rows[0];
  if (!sess) return null;
  if (Number(sess.expires_at) < Date.now()) {
    await db.execute({ sql: "delete from sessions where token=?", args: [token] });
    return null;
  }

  const u = await db.execute({
    sql: "select id, email, name, avatar, favorite_team from users where id=?",
    args: [sess.user_id as string],
  });
  const row = u.rows[0];
  if (!row) return null;
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    avatar: row.avatar as string,
    favorite_team: row.favorite_team as string,
  };
}
