import "server-only";
import type { Client } from "@libsql/client";

/**
 * Kết nối CSDL (libsql/SQLite).
 *  - Local dev: file `./data/wc.db` (client Node, tự tạo thư mục).
 *  - Production (Vercel/serverless): đặt DATABASE_URL (Turso, libsql://...) +
 *    DATABASE_AUTH_TOKEN → dùng client WEB (thuần JS, hợp serverless) → dữ liệu
 *    nằm trên đám mây, đồng bộ mọi thiết bị.
 */

let clientPromise: Promise<Client> | null = null;
let ready: Promise<void> | null = null;

async function makeClient(): Promise<Client> {
  // .trim(): chống ký tự thừa/khoảng trắng/xuống dòng lỡ dán vào env trên dashboard.
  const rawUrl = (process.env.DATABASE_URL ?? "file:./data/wc.db").trim();
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim();

  if (rawUrl.startsWith("file:")) {
    // Local: client Node hỗ trợ file + tạo thư mục nếu chưa có.
    const [{ createClient }, { existsSync, mkdirSync }, { dirname }] = await Promise.all([
      import("@libsql/client"),
      import("node:fs"),
      import("node:path"),
    ]);
    const path = rawUrl.slice("file:".length);
    const dir = dirname(path);
    if (dir && dir !== "." && !existsSync(dir)) mkdirSync(dir, { recursive: true });
    return createClient({ url: rawUrl, authToken });
  }

  // Production: client web cho DB từ xa (Turso).
  // Đổi libsql:// -> https:// vì fetch của runtime không hiểu scheme libsql://.
  const url = rawUrl.replace(/^libsql:\/\//, "https://");
  const { createClient } = await import("@libsql/client/web");
  return createClient({ url, authToken }) as unknown as Client;
}

async function initSchema(c: Client) {
  await c.batch(
    [
      `create table if not exists users (
        id text primary key,
        email text unique not null,
        password text not null,
        name text not null,
        avatar text not null default '',
        favorite_team text not null default '',
        created_at integer not null
      )`,
      `create table if not exists sessions (
        token text primary key,
        user_id text not null,
        expires_at integer not null
      )`,
      `create table if not exists predictions (
        user_id text not null,
        match_id text not null,
        market text not null,
        value text not null,
        created_at integer not null,
        primary key (user_id, match_id, market)
      )`,
    ],
    "write",
  );
}

export async function getDb(): Promise<Client> {
  if (!clientPromise) clientPromise = makeClient();
  const c = await clientPromise;
  if (!ready) ready = initSchema(c);
  await ready;
  return c;
}
