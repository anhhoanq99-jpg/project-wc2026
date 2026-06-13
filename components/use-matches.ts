"use client";

import { useSyncExternalStore } from "react";
import { getAllMatches } from "@/lib/data/fixtures";
import type { Match } from "@/lib/types";

/**
 * Store chung: lấy lịch + tỉ số thật từ /api/matches (nguồn TheSportsDB),
 * TỰ LÀM MỚI mỗi 30 giây để cập nhật kết quả/trạng thái live. Một poller duy
 * nhất cho cả app. Mất mạng -> fallback lịch tĩnh (trạng thái tính theo giờ).
 */

const REFRESH_MS = 30_000;

let cache: Match[] | null = null;
let polling = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

async function refresh() {
  try {
    const res = await fetch("/api/matches", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as Match[];
    if (Array.isArray(data) && data.length) {
      cache = data;
      emit();
      return;
    }
    throw new Error("empty");
  } catch {
    if (!cache) {
      cache = getAllMatches(); // fallback offline
      emit();
    }
  }
}

function ensurePolling() {
  if (polling) return;
  polling = true;
  refresh();
  setInterval(refresh, REFRESH_MS);
  // Làm mới khi quay lại tab.
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });
  }
}

function subscribe(cb: () => void): () => void {
  subs.add(cb);
  ensurePolling();
  return () => {
    subs.delete(cb);
  };
}

const getSnapshot = () => cache;
const getServerSnapshot = (): Match[] | null => null;

/** Lịch đấu (null khi chưa tải xong lần đầu). Tự cập nhật mỗi 30s. */
export function useMatches(): Match[] | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
