"use client";

import { useSyncExternalStore } from "react";
import { getAllMatches } from "@/lib/data/fixtures";
import type { Match } from "@/lib/types";

/**
 * Store chung: lấy lịch + tỉ số thật từ /api/matches (nguồn TheSportsDB),
 * TỰ LÀM MỚI mỗi 30 giây để cập nhật kết quả/trạng thái live. Một poller duy
 * nhất cho cả app. Mất mạng -> fallback lịch tĩnh (trạng thái tính theo giờ).
 */

const REFRESH_MS = 30_000; // nhịp làm mới khi đã có dữ liệu thật
const RETRY_MS = 3_000; // thử lại nhanh khi API chưa sẵn sàng (vd server vừa khởi động)

let cache: Match[] | null = null;
let liveLoaded = false; // đã từng nhận dữ liệu thật từ API chưa
let polling = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function schedule(ms: number) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(refresh, ms);
}

async function refresh() {
  try {
    const res = await fetch("/api/matches", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as Match[];
    if (Array.isArray(data) && data.length) {
      cache = data;
      liveLoaded = true;
      emit();
      schedule(REFRESH_MS);
      return;
    }
    throw new Error("empty");
  } catch {
    // Chưa lấy được dữ liệu thật: tạm hiển thị lịch tĩnh để không trống trang,
    // rồi THỬ LẠI NHANH (3s) cho tới khi API sẵn sàng -> tự nâng cấp lên tỉ số thật.
    if (!cache) {
      cache = getAllMatches();
      emit();
    }
    schedule(liveLoaded ? REFRESH_MS : RETRY_MS);
  }
}

function ensurePolling() {
  if (polling) return;
  polling = true;
  refresh();
  // Làm mới khi quay lại tab (và thử lại ngay nếu chưa có dữ liệu thật).
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
