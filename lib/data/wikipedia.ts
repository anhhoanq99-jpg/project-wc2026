import type { Goal } from "@/lib/types";

/**
 * NGUỒN TỰ ĐỘNG: đọc tỉ số + cầu thủ ghi bàn từ Wikipedia (các trang
 * "2026 FIFA World Cup Group A…L"), tự cập nhật liên tục (cache 10 phút).
 * Mã đội của Wikipedia (vd GER, CUW) trùng mã nội bộ nên không cần ánh xạ tên.
 */

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
const UA = "wc2026-fan-app/1.0 (educational, non-commercial)";

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

async function fetchGroupWikitext(group: string): Promise<string> {
  const url =
    "https://en.wikipedia.org/w/api.php?action=parse" +
    `&page=2026_FIFA_World_Cup_Group_${group}` +
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

/** Phân tích danh sách ghi bàn của 1 đội (goals1 hoặc goals2). */
function parseGoalList(raw: string, side: "home" | "away"): Goal[] {
  const goals: Goal[] = [];
  for (const line of raw.split("\n")) {
    let body = line.trim().replace(/^\*+\s*/, "");
    if (!body || !body.includes("'")) continue; // dòng ghi bàn luôn có dấu phút '

    // Tên cầu thủ: ưu tiên phần hiển thị trong [[link|hiển thị]].
    let name = "—";
    const link = body.match(/\[\[([^\]]+?)\]\]/);
    if (link) {
      const inner = link[1];
      name = inner.includes("|") ? inner.split("|").pop()! : inner;
      body = body.replace(/\[\[[^\]]+?\]\]/, " ");
    } else {
      const nm = body.match(/^([^0-9]+?)\s*\d/);
      if (nm) name = nm[1].trim();
    }
    name = name.replace(/\s*\(.*?\)\s*/g, "").trim() || "—";

    // Mỗi phút (cách nhau bởi dấu phẩy) là một bàn; lấy SỐ ĐẦU TIÊN làm phút
    // cơ bản để xử lý bù giờ "45+5'", "90+8'".
    for (const tok of body.split(",")) {
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
  return goals;
}

/** Phân tích 1 trang bảng → các trận ĐÃ có tỉ số. */
function parseGroupPage(wt: string): WikiMatch[] {
  const out: WikiMatch[] = [];
  const blocks = wt.split(/\{\{#invoke:football box\|main/);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].slice(0, 2500);
    const t1 = block.match(/team1=\{\{#invoke:flag\|[^|}]*\|([A-Za-z]{3})/);
    const t2 = block.match(/team2=\{\{#invoke:flag\|[^|}]*\|([A-Za-z]{3})/);
    const sc = block.match(/score=(?:\{\{score link\|[^|]*\|)?\s*(\d+)\s*[–-]\s*(\d+)/);
    if (!t1 || !t2 || !sc) continue; // chưa đá / không đọc được -> bỏ qua

    const gm = block.match(
      /goals1=([\s\S]*?)\|goals2=([\s\S]*?)\|(?:stadium|location|referee|attendance)/i,
    );
    const goals = [
      ...(gm ? parseGoalList(gm[1], "home") : []),
      ...(gm ? parseGoalList(gm[2], "away") : []),
    ].sort((a, b) => a.minute - b.minute);

    out.push({
      homeCode: t1[1].toUpperCase(),
      awayCode: t2[1].toUpperCase(),
      homeScore: parseInt(sc[1], 10),
      awayScore: parseInt(sc[2], 10),
      goals,
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
