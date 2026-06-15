"use client";

import type { Prediction } from "@/lib/scoring";
import type { MarketId } from "@/lib/data/markets";

/**
 * Lưu trữ dữ liệu người dùng với 2 chế độ:
 *  - "local": ẩn danh, lưu localStorage (mất khi xóa trình duyệt/đổi máy).
 *  - "server": đã ĐĂNG NHẬP, lưu trên máy chủ (DB) → bền vững, đồng bộ thiết bị.
 * Component dùng chung một API; chuyển backend qua enter/exitServerMode().
 * Có cache trong bộ nhớ để dùng an toàn với useSyncExternalStore (ref ổn định).
 */

const K_PROFILE = "wc26:profile";
const K_PREDS = "wc26:preds";

export interface Profile {
  deviceId: string;
  name: string;
  avatar: string;
  favoriteTeam: string;
}

export const AVATARS = ["⚽", "🦁", "🐯", "🦅", "🐉", "🔥", "⭐", "👑", "🚀", "🎯", "🏆", "💪"];

let profileCache: Profile | null = null;
let predsCache: Prediction[] | null = null;
let serverMode = false;

const subs = new Set<() => void>();
function emit() {
  subs.forEach((f) => f());
}
export function subscribe(fn: () => void): () => void {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxxxxxx".replace(/x/g, () => ((Math.random() * 16) | 0).toString(16));
}

const EMPTY_PROFILE: Profile = { deviceId: "", name: "", avatar: "", favoriteTeam: "" };
const EMPTY: Prediction[] = [];

/* ----------------------------- chế độ server ----------------------------- */

/** Vào chế độ server sau khi đăng nhập (dữ liệu lấy từ máy chủ). */
export function enterServerMode(profile: Profile, predictions: Prediction[]) {
  serverMode = true;
  profileCache = profile;
  predsCache = predictions;
  emit();
}

/** Thoát chế độ server (đăng xuất) → quay lại dữ liệu ẩn danh trên máy. */
export function exitServerMode() {
  serverMode = false;
  profileCache = null;
  predsCache = null;
  emit();
}

export function isServerMode() {
  return serverMode;
}

/* ------------------------------- hồ sơ ----------------------------------- */

export function getProfile(): Profile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  if (profileCache) return profileCache;
  if (serverMode) return EMPTY_PROFILE;
  try {
    const raw = localStorage.getItem(K_PROFILE);
    if (raw) {
      profileCache = { avatar: "", favoriteTeam: "", ...JSON.parse(raw) } as Profile;
      return profileCache;
    }
  } catch {}
  profileCache = { deviceId: uuid(), name: "", avatar: "", favoriteTeam: "" };
  localStorage.setItem(K_PROFILE, JSON.stringify(profileCache));
  return profileCache;
}

function saveProfile(patch: Partial<Profile>) {
  const p = { ...getProfile(), ...patch };
  profileCache = p;
  emit();
  if (serverMode) {
    fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => {});
  } else {
    localStorage.setItem(K_PROFILE, JSON.stringify(p));
  }
}

export function setName(name: string) {
  saveProfile({ name: name.trim().slice(0, 24) });
}
export function setAvatar(avatar: string) {
  saveProfile({ avatar });
}
export function setFavoriteTeam(code: string) {
  saveProfile({ favoriteTeam: code });
}

/** Tham gia ẩn danh: lưu hồ sơ lần đầu trên máy. */
export function joinProfile(data: { name: string; avatar: string; favoriteTeam: string }) {
  saveProfile({
    name: data.name.trim().slice(0, 24),
    avatar: data.avatar,
    favoriteTeam: data.favoriteTeam,
  });
}

export function isJoined(): boolean {
  return !!getProfile().name;
}

/* ----------------------------- dự đoán ----------------------------------- */

export function getPredictions(): Prediction[] {
  if (typeof window === "undefined") return EMPTY;
  if (predsCache) return predsCache;
  if (serverMode) return EMPTY;
  try {
    const raw = localStorage.getItem(K_PREDS);
    predsCache = raw ? (JSON.parse(raw) as Prediction[]) : [];
  } catch {
    predsCache = [];
  }
  return predsCache;
}

function setPredsCache(list: Prediction[]) {
  predsCache = list;
  emit();
  if (!serverMode) localStorage.setItem(K_PREDS, JSON.stringify(list));
}

export function placePrediction(matchId: string, market: MarketId, value: string) {
  const list = getPredictions().filter(
    (p) => !(p.matchId === matchId && p.market === market),
  );
  setPredsCache([...list, { matchId, market, value, createdAt: Date.now() }]);
  if (serverMode) {
    fetch("/api/predictions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, market, value }),
    }).catch(() => {});
  }
}

export function removePrediction(matchId: string, market: MarketId) {
  setPredsCache(
    getPredictions().filter((p) => !(p.matchId === matchId && p.market === market)),
  );
  if (serverMode) {
    fetch(
      `/api/predictions?matchId=${encodeURIComponent(matchId)}&market=${encodeURIComponent(market)}`,
      { method: "DELETE" },
    ).catch(() => {});
  }
}

export function getPrediction(matchId: string, market: MarketId): Prediction | undefined {
  return getPredictions().find((p) => p.matchId === matchId && p.market === market);
}

/** Đọc dự đoán ẩn danh đang lưu trên máy (để mang theo khi đăng ký). */
export function readLocalPredictions(): Prediction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(K_PREDS);
    return raw ? (JSON.parse(raw) as Prediction[]) : [];
  } catch {
    return [];
  }
}
