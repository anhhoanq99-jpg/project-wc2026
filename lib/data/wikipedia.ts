import type { Goal } from "@/lib/types";

/**
 * NGUỒN TỰ ĐỘNG: đọc tỉ số + cầu thủ ghi bàn từ Wikipedia (các trang
 * "2026 FIFA World Cup Group A…L"), tự cập nhật liên tục (cache 10 phút).
 * Mã đội của Wikipedia (mã FIFA) phần lớn trùng mã nội bộ; vài đội lệch (vd
 * Wikipedia dùng KSA/URU còn app dùng SAU/URY) nên cần ánh xạ qua WIKI_CODE_FIX.
 */

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const UA = "wc2026-fan-app/1.0 (educational, non-commercial)";

/**
 * Ánh xạ mã FIFA của Wikipedia -> mã nội bộ khi hai bên KHÁC nhau.
 * (Đối chiếu toàn bộ 48 đội: chỉ Ả Rập Xê Út và Uruguay bị lệch.)
 */
const WIKI_CODE_FIX: Record<string, string> = {
  KSA: "SAU", // Ả Rập Xê Út
  URU: "URY", // Uruguay
};

/** Chuẩn hoá mã đội Wikipedia về mã nội bộ. */
function canonCode(code: string): string {
  const up = code.toUpperCase();
  return WIKI_CODE_FIX[up] ?? up;
}

export interface WikiMatch {
  homeCode: string; // = team1 của Wikipedia
  awayCode: string; // = team2
  homeScore: number;
  awayScore: number;
  goals: Goal[]; // side "home" = của team1, "away" = của team2
}

/** Khoá cặp đấu không phân biệt sân nhà/khách. */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

/** Lấy wikitext thô của 1 trang Wikipedia (cache 10 phút, tự làm mới). */
async function fetchPageWikitext(page: string): Promise<string> {
  const url =
    "https://en.wikipedia.org/w/api.php?action=parse" +
    `&page=${encodeURIComponent(page)}` +
    "&prop=wikitext&format=json&formatversion=2";
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(6000),
    next: { revalidate: 600 }, // cache 10 phút, tự làm mới
  });
  if (!res.ok) throw new Error(String(res.status));
  const json = (await res.json()) as { parse?: { wikitext?: string } };
  return json.parse?.wikitext ?? "";
}

function fetchGroupWikitext(group: string): Promise<string> {
  return fetchPageWikitext(`2026_FIFA_World_Cup_Group_${group}`);
}

/** Phân tích danh sách ghi bàn của 1 đội (goals1 hoặc goals2).
 *
 * Wikipedia dùng HAI định dạng phút ghi bàn lẫn lộn giữa các trang:
 *   - Dạng chữ:      "Larin 78'", "Embolo 17' pen.", "Muheim 90+4' o.g."
 *   - Dạng template: "Al-Amri {{goal|41}}", "{{pen.|17}}", "{{og|90}}"
 * Parser xử lý cả hai để không bỏ sót cầu thủ ghi bàn.
 */
function parseGoalList(raw: string, side: "home" | "away"): Goal[] {
  const goals: Goal[] = [];
  for (const line of raw.split("\n")) {
    const body = line.trim().replace(/^\*+\s*/, "");
    if (!body) continue;

    const hasTemplate = /\{\{\s*(goal|pen|og|o\.g)/i.test(body);
    const hasApostrophe = body.includes("'");
    if (!hasTemplate && !hasApostrophe) continue; // không có phút -> không phải dòng ghi bàn

    // Tên cầu thủ: ưu tiên phần hiển thị trong [[link|hiển thị]].
    let name = "—";
    const link = body.match(/\[\[([^\]]+?)\]\]/);
    if (link) {
      const inner = link[1];
      name = inner.includes("|") ? inner.split("|").pop()! : inner;
    } else {
      const nm = body.match(/^([^0-9{[]+?)\s*(?:\d|\{\{)/);
      if (nm) name = nm[1].trim();
    }
    name = name.replace(/\s*\(.*?\)\s*/g, "").trim() || "—";

    // Bỏ link để không nhiễu khi quét phút.
    const rest = body.replace(/\[\[[^\]]+?\]\]/g, " ");

    if (hasTemplate) {
      // Mỗi template {{goal|N}} / {{pen.|N}} / {{og|N}} là một bàn.
      const re = /\{\{\s*(goal|pen\.?|og|o\.g\.?)\s*\|\s*(\d+)/gi;
      let mt: RegExpExecArray | null;
      while ((mt = re.exec(rest))) {
        const tag = mt[1].toLowerCase();
        const kind: Goal["kind"] = tag.startsWith("pen")
          ? "penalty"
          : tag.startsWith("o")
            ? "own"
            : "goal";
        goals.push({ side, player: name, minute: parseInt(mt[2], 10), kind });
      }
    } else {
      // Mỗi phút (cách nhau bởi dấu phẩy) là một bàn; lấy SỐ ĐẦU TIÊN làm phút
      // cơ bản để xử lý bù giờ "45+5'", "90+8'".
      for (const tok of rest.split(",")) {
        if (!tok.includes("'")) continue;
        const mm = tok.match(/(\d+)/);
        if (!mm) continue;
        const kind: Goal["kind"] = /o\.g\./i.test(tok)
          ? "own"
          : /pen/i.test(tok)
            ? "penalty"
            : "goal";
        goals.push({ side, player: name, minute: parseInt(mm[1], 10), kind });
      }
    }
  }
  return goals;
}

/**
 * Phân tích 1 khối "football box" (1 trận) -> tỉ số + cầu thủ ghi bàn.
 * Trả null nếu trận chưa đá (cờ đội bị bỏ trống / chưa có tỉ số).
 * Dùng chung cho cả trang vòng bảng lẫn trang loại trực tiếp.
 */
function parseFootballBox(block: string): WikiMatch | null {
  // Cờ đội có thể bị comment khi chưa xác định đội (vd "<!--{{#invoke:flag|fb-rt|}}-->").
  const t1 = block.match(/team1=(?:<!--)?\{\{#invoke:flag\|[^|}]*\|([A-Za-z]{3})/);
  const t2 = block.match(/team2=(?:<!--)?\{\{#invoke:flag\|[^|}]*\|([A-Za-z]{3})/);
  const sc = block.match(/score=(?:\{\{score link\|[^|]*\|)?\s*(\d+)\s*[–-]\s*(\d+)/);
  if (!t1 || !t2 || !sc) return null; // chưa đá / không đọc được -> bỏ qua

  const gm = block.match(
    /goals1=([\s\S]*?)\|goals2=([\s\S]*?)\|(?:stadium|location|referee|attendance)/i,
  );
  const goals = [
    ...(gm ? parseGoalList(gm[1], "home") : []),
    ...(gm ? parseGoalList(gm[2], "away") : []),
  ].sort((a, b) => a.minute - b.minute);

  return {
    homeCode: canonCode(t1[1]),
    awayCode: canonCode(t2[1]),
    homeScore: parseInt(sc[1], 10),
    awayScore: parseInt(sc[2], 10),
    goals,
  };
}

/** Phân tích 1 trang bảng → các trận ĐÃ có tỉ số. */
function parseGroupPage(wt: string): WikiMatch[] {
  const out: WikiMatch[] = [];
  const blocks = wt.split(/\{\{#invoke:football box\|main/);
  for (let i = 1; i < blocks.length; i++) {
    const box = parseFootballBox(blocks[i].slice(0, 2500));
    if (box) out.push(box);
  }
  return out;
}

/* ----------------------- VÒNG LOẠI TRỰC TIẾP (Wikipedia) ----------------------- */

export type WikiRound = "r32" | "r16" | "qf" | "sf" | "third" | "final";

export interface WikiKnockoutTie {
  round: WikiRound;
  homeCode: string;
  awayCode: string;
  homeScore: number;
  awayScore: number;
}

/** Tiêu đề mục (==X==) của trang knock-out -> mã vòng. */
function roundFromHeader(h: string): WikiRound | null {
  const s = h.trim().toLowerCase();
  if (/round of 32/.test(s)) return "r32";
  if (/round of 16/.test(s)) return "r16";
  if (/quarter/.test(s)) return "qf";
  if (/semi/.test(s)) return "sf";
  if (/third/.test(s)) return "third";
  if (/^final$/.test(s)) return "final";
  return null;
}

/**
 * Đọc kết quả vòng loại trực tiếp từ trang "2026 FIFA World Cup knockout stage".
 * Mỗi football box được gán vào vòng theo tiêu đề (==Round of 32==…) gần nhất phía
 * trước nó. Trận chưa đá (đội còn là "Runner-up Group A") tự bị bỏ qua.
 */
export async function fetchWikiKnockout(): Promise<WikiKnockoutTie[]> {
  let wt = "";
  try {
    wt = await fetchPageWikitext("2026_FIFA_World_Cup_knockout_stage");
  } catch {
    return [];
  }
  if (!wt) return [];

  // Vị trí từng tiêu đề vòng (chỉ lấy mục level 2 "==X==").
  const headers: { idx: number; round: WikiRound }[] = [];
  const hre = /^==([^=\n][^=\n]*?)==\s*$/gm;
  let hm: RegExpExecArray | null;
  while ((hm = hre.exec(wt))) {
    const round = roundFromHeader(hm[1]);
    if (round) headers.push({ idx: hm.index, round });
  }
  if (!headers.length) return [];

  const out: WikiKnockoutTie[] = [];
  const bre = /\{\{#invoke:football box\|main/g;
  let bm: RegExpExecArray | null;
  while ((bm = bre.exec(wt))) {
    // Vòng = tiêu đề gần nhất nằm TRƯỚC khối trận này.
    let round: WikiRound | null = null;
    for (const h of headers) {
      if (h.idx < bm.index) round = h.round;
      else break;
    }
    if (!round) continue;
    const box = parseFootballBox(wt.slice(bm.index, bm.index + 2500));
    if (!box) continue;
    out.push({
      round,
      homeCode: box.homeCode,
      awayCode: box.awayCode,
      homeScore: box.homeScore,
      awayScore: box.awayScore,
    });
  }
  return out;
}

/**
 * Lấy toàn bộ kết quả các trận đã đá từ Wikipedia, gom theo cặp đấu.
 * Lỗi từng bảng được bỏ qua (trả phần đọc được) để không làm hỏng cả app.
 */
export async function fetchWikiResults(): Promise<Map<string, WikiMatch>> {
  const pages = await Promise.all(
    GROUPS.map((g) => fetchGroupWikitext(g).catch(() => "")),
  );
  const map = new Map<string, WikiMatch>();
  for (const wt of pages) {
    if (!wt) continue;
    for (const m of parseGroupPage(wt)) {
      map.set(pairKey(m.homeCode, m.awayCode), m);
    }
  }
  return map;
}
