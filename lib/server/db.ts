import "server-only";
import { createClient, type Client } from "@libsql/client";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Kết nối CSDL (libsql/SQLite). Mặc định file local `./data/wc.db` (chạy ngay).
 * Khi deploy: đặt biến môi trường DATABASE_URL (Turso) + DATABASE_AUTH_TOKEN
 * để DỮ LIỆU NẰM TRÊN ĐÁM MÂY → đồng bộ mọi thiết bị, không mất khi đổi máy.
 */

let client: Client | null = null;
let ready: Promise<void> | null = null;

function makeClient(): Client {
  const url = process.env.DATABASE_URL ?? "file:./data/wc.db";
  if (url.startsWith("file:")) {
    const path = url.slice("file:".length);
    const dir = dirname(path);
    if (dir && dir !== "." && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  return createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
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
  if (!client) client = makeClient();
  if (!ready) ready = initSchema(client);
  await ready;
  return client;
}
