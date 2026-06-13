/**
 * Kênh phát sóng World Cup 2026 + link xem trực tiếp trên VTVGo — nhà đài Việt
 * Nam CÓ BẢN QUYỀN. Web chỉ CHUYỂN HƯỚNG tới VTVGo để xem, không phát lại.
 *
 * VTV phát World Cup 2026 chủ yếu trên VTV2, VTV3, VTV5. Lịch phát CHÍNH XÁC
 * từng trận do VTV công bố theo ngày — điền vào CHANNEL_OVERRIDES khi đã biết.
 */

export interface Channel {
  name: string;
  url: string;
}

export const VTVGO_HOME = "https://vtvgo.vn/";
export const VTVGO_CHANNELS = "https://vtvgo.vn/channel";

export const CHANNELS: Record<string, Channel> = {
  VTV2: { name: "VTV2", url: "https://vtvgo.vn/xem-truc-tuyen-kenh-vtv2-2.html" },
  VTV3: { name: "VTV3", url: "https://vtvgo.vn/channel/vtv3-1,3.html" },
  VTV5: { name: "VTV5", url: "https://vtvgo.vn/xem-truc-tuyen-kenh-vtv5-5.html" },
};

const POOL = ["VTV3", "VTV5", "VTV2"]; // VTV3 là kênh chính

/**
 * Lịch phát CHÍNH XÁC từng trận (id trận -> tên kênh). Điền dần khi có lịch VTV.
 * Ví dụ: "C-BRA-MAR": "VTV3".
 */
export const CHANNEL_OVERRIDES: Record<string, string> = {
  // "A-MEX-RSA": "VTV3",
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Kênh phát của một trận: ưu tiên lịch chính xác (override), nếu chưa có thì gợi ý. */
export function channelForMatch(id: string): Channel {
  const override = CHANNEL_OVERRIDES[id];
  if (override && CHANNELS[override]) return CHANNELS[override];
  return CHANNELS[POOL[hash(id) % POOL.length]];
}

/** Có lịch chính xác cho trận này chưa (để hiển thị nhãn "gợi ý" nếu chưa). */
export function isExactChannel(id: string): boolean {
  return !!CHANNEL_OVERRIDES[id];
}
