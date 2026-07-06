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
  homePens?: number; // luân lưu (knock-out hòa sau hiệp phụ)
  awayPens?: number;
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

  const out: WikiMatch = {
    homeCode: canonCode(t1[1]),
    awayCode: canonCode(t2[1]),
    homeScore: parseInt(sc[1], 10),
    awayScore: parseInt(sc[2], 10),
    goals,
  };

  // Luân lưu (nếu trận hòa sau hiệp phụ).
  const pen = block.match(/penaltyscore=\s*(\d+)\s*[–-]\s*(\d+)/);
  if (pen) {
    out.homePens = parseInt(pen[1], 10);
    out.awayPens = parseInt(pen[2], 10);
  }

  return out;
}

/** Phân tích 1 trang bảng → các trận ĐÃ có tỉ số. */
function parseGroupPage(wt: string): WikiMatch[] {
  const out: WikiMatch[] = [];
  // Wikipedia dùng lẫn "football box" và "Football box" giữa các trang.
  const blocks = wt.split(/\{\{#invoke:[Ff]ootball box\|main/);
  for (let i = 1; i < blocks.length; i++) {
    const box = parseFootballBox(blocks[i].slice(0, 4000));
    if (box) out.push(box);
  }
  return out;
}

/* ----------------------- VÒNG LOẠI TRỰC TIẾP (Wikipedia) ----------------------- */

export type WikiRound = "r32" | "r16" | "qf" | "sf" | "third" | "final";

/** Một nhánh trên sơ đồ RoundN của Wikipedia (null = chưa xác định). */
export interface WikiBracketTie {
  round: WikiRound;
  homeCode: string | null;
  awayCode: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePens: number | null;
  awayPens: number | null;
}

/** Chú thích vòng trong template RoundN -> mã vòng. */
const BRACKET_COMMENT: [RegExp, WikiRound][] = [
  [/round of 32/i, "r32"],
  [/round of 16/i, "r16"],
  [/quarter/i, "qf"],
  [/semi/i, "sf"],
  [/third place/i, "third"],
  [/^final$/i, "final"],
];

/** Tách 1 dòng dữ liệu RoundN thành các ô, bỏ qua dấu | nằm trong [[..]]/{{..}}. */
function splitRowCells(line: string): string[] {
  const cells: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < line.length; i++) {
    const two = line.slice(i, i + 2);
    if (two === "[[" || two === "{{") {
      depth++;
      cur += two;
      i++;
    } else if (two === "]]" || two === "}}") {
      depth = Math.max(0, depth - 1);
      cur += two;
      i++;
    } else if (line[i] === "|" && depth === 0) {
      cells.push(cur);
      cur = "";
    } else {
      cur += line[i];
    }
  }
  cells.push(cur);
  return cells;
}

/** Mã đội trong 1 ô ("{{#invoke:flag|fb|GER}} {{pso}}"); null nếu chưa xác định. */
function cellTeamCode(cell: string): string | null {
  // Cờ bị comment ("<!--{{#invoke:flag|fb|}}-->Winner Match 93") -> chưa có đội.
  const m = cell.replace(/<!--[\s\S]*?-->/g, "").match(/\{\{#invoke:flag\|[^|}]*\|([A-Za-z]{3})/);
  return m ? canonCode(m[1]) : null;
}

/** Tỉ số trong 1 ô ("1 (3)" -> 1 bàn, 3 luân lưu). */
function cellScore(cell: string): { score: number | null; pens: number | null } {
  const m = cell.match(/(\d+)\s*(?:\((\d+)\))?/);
  if (!m) return { score: null, pens: null };
  return { score: parseInt(m[1], 10), pens: m[2] ? parseInt(m[2], 10) : null };
}

/**
 * Đọc SƠ ĐỒ loại trực tiếp từ template {{#invoke:RoundN|N32}} trên trang
 * "2026 FIFA World Cup knockout stage" — nguồn gọn nhất, có đủ 6 vòng theo
 * ĐÚNG THỨ TỰ NHÁNH, kèm tỉ số + luân lưu, cập nhật ngay khi trận kết thúc.
 */
export async function fetchWikiBracket(): Promise<WikiBracketTie[]> {
  let wt = "";
  try {
    wt = await fetchPageWikitext("2026_FIFA_World_Cup_knockout_stage");
  } catch {
    return [];
  }
  const start = wt.indexOf("{{#invoke:RoundN");
  if (start < 0) return [];
  const end = wt.indexOf("<section end=\"Bracket\"", start);
  const block = wt.slice(start, end > start ? end : undefined);

  const out: WikiBracketTie[] = [];
  let round: WikiRound | null = null;

  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim();

    // Dòng chú thích vòng: <!--Round of 32-->, <!--Final-->...
    const cm = line.match(/^<!--([^>]*?)-->$/);
    if (cm) {
      const label = cm[1].trim();
      const hit = BRACKET_COMMENT.find(([re]) => re.test(label));
      round = hit ? hit[1] : round;
      continue;
    }

    if (!round || !line.startsWith("|")) continue;
    const cells = splitRowCells(line.slice(1));
    // Dòng dữ liệu: [ngày – sân, đội 1, tỉ số 1, đội 2, tỉ số 2]
    if (cells.length < 5) continue;
    if (/^(RD\d|style|widescore|bold_winner|3rdplace|Consol|team-width|score-width)/i.test(cells[0]))
      continue;

    const s1 = cellScore(cells[2]);
    const s2 = cellScore(cells[4]);
    out.push({
      round,
      homeCode: cellTeamCode(cells[1]),
      awayCode: cellTeamCode(cells[3]),
      homeScore: s1.score,
      awayScore: s2.score,
      homePens: s1.pens,
      awayPens: s2.pens,
    });
  }
  return out;
}

/**
 * Các trang chứa football box của vòng loại trực tiếp. Wikipedia tách dần từng
 * vòng ra trang riêng (round of 32, final...) — trang chưa tồn tại tự bị bỏ qua.
 */
const KNOCKOUT_PAGES = [
  "2026_FIFA_World_Cup_knockout_stage",
  "2026_FIFA_World_Cup_round_of_32",
  "2026_FIFA_World_Cup_round_of_16",
  "2026_FIFA_World_Cup_quarterfinals",
  "2026_FIFA_World_Cup_quarter-finals",
  "2026_FIFA_World_Cup_semifinals",
  "2026_FIFA_World_Cup_semi-finals",
  "2026_FIFA_World_Cup_final",
];

/**
 * Kết quả CHI TIẾT (tỉ số + luân lưu + cầu thủ ghi bàn) các trận knock-out ĐÃ ĐÁ,
 * gom theo cặp đấu — dùng phủ lên lịch tĩnh giống fetchWikiResults của vòng bảng.
 */
export async function fetchWikiKnockoutResults(): Promise<Map<string, WikiMatch>> {
  const pages = await Promise.all(
    KNOCKOUT_PAGES.map((p) => fetchPageWikitext(p).catch(() => "")),
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
