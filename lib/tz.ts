/** Tiện ích thời gian — hiển thị theo giờ Việt Nam (Asia/Ho_Chi_Minh). */

const VN_TZ = "Asia/Ho_Chi_Minh";

/** Khoá ngày theo giờ VN, dạng "YYYY-MM-DD". */
export function vnDayKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  // en-CA cho ra định dạng YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Khoá ngày hôm nay theo giờ VN. */
export function vnTodayKey(now: number = Date.now()): string {
  return vnDayKey(new Date(now));
}

/** Giờ:phút theo giờ VN, vd "02:00". */
export function vnTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** Nhãn ngày tiếng Việt, vd "Thứ Bảy, 13/06". */
export function vnDateLabel(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VN_TZ,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

/** "Hôm nay" / "Ngày mai" / nhãn ngày, so theo giờ VN. */
export function vnRelativeDay(iso: string, now: number = Date.now()): string {
  const key = vnDayKey(iso);
  const today = vnTodayKey(now);
  const tomorrow = vnDayKey(new Date(now + 86400000));
  const yesterday = vnDayKey(new Date(now - 86400000));
  if (key === today) return "Hôm nay";
  if (key === tomorrow) return "Ngày mai";
  if (key === yesterday) return "Hôm qua";
  return vnDateLabel(iso);
}
