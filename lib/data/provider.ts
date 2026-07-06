import type { Match, MatchStatus, Goal } from "@/lib/types";
import { getAllMatches, KO_RAW } from "@/lib/data/fixtures";
import { GOAL_OVERRIDES } from "@/lib/data/goal-overrides";
import {
  fetchWikiResults,
  fetchWikiKnockoutResults,
  fetchWikiBracket,
  pairKey,
  type WikiMatch,
  type WikiBracketTie,
  type WikiRound,
} from "@/lib/data/wikipedia";

/**
 * Phủ KẾT QUẢ/TỈ SỐ THẬT lên lịch tĩnh, lấy từ TheSportsDB (miễn phí, không cần
 * key — dùng key test "3"). League 4429 = FIFA World Cup, mùa 2026.
 *
 * Lịch đầy đủ 72 trận lấy từ fixtures.ts; API cung cấp tỉ số + trạng thái + giờ
 * chính xác cho các trận đã/đang diễn ra và tự cập nhật mỗi ngày.
 */

const API = "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4429&s=2026";

/** Chuẩn hoá tên đội (bỏ dấu, ký tự đặc biệt) để khớp tên giữa API và dữ liệu nội bộ. */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/** Tên (đã chuẩn hoá) -> mã đội nội bộ. */
const NAME_TO_CODE: Record<string, string> = {
  mexico: "MEX", southafrica: "RSA", southkorea: "KOR", korearepublic: "KOR",
  czechrepublic: "CZE", czechia: "CZE", canada: "CAN", bosniaherzegovina: "BIH",
  qatar: "QAT", switzerland: "SUI", brazil: "BRA", morocco: "MAR", haiti: "HAI",
  scotland: "SCO", usa: "USA", unitedstates: "USA", paraguay: "PAR",
  australia: "AUS", turkey: "TUR", turkiye: "TUR", germany: "GER",
  curacao: "CUW", ivorycoast: "CIV", cotedivoire: "CIV", ecuador: "ECU",
  netherlands: "NED", japan: "JPN", sweden: "SWE", tunisia: "TUN",
  belgium: "BEL", egypt: "EGY", iran: "IRN", newzealand: "NZL", spain: "ESP",
  capeverde: "CPV", caboverde: "CPV", saudiarabia: "SAU", uruguay: "URY",
  france: "FRA", senegal: "SEN", iraq: "IRQ", norway: "NOR", argentina: "ARG",
  algeria: "ALG", austria: "AUT", jordan: "JOR", portugal: "POR",
  drcongo: "COD", congodr: "COD", democraticrepublicofcongo: "COD",
  uzbekistan: "UZB", colombia: "COL", england: "ENG", croatia: "CRO",
  ghana: "GHA", panama: "PAN",
};

function codeOf(apiName?: string): string | null {
  if (!apiName) return null;
  return NAME_TO_CODE[norm(apiName)] ?? null;
}

interface SdbEvent {
  idEvent?: string;
  strEvent?: string | null;
  strStage?: string | null;
  intRound?: string | null;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string | null;
  strProgress?: string | null;
  strTimestamp?: string | null;
}

/** Lấy toàn bộ sự kiện mùa giải (cache ngắn, dùng chung cho lịch & sơ đồ). */
async function fetchSeasonEvents(): Promise<SdbEvent[]> {
  const res = await fetch(API, { next: { revalidate: 20 } });
  if (!res.ok) throw new Error(String(res.status));
  const json = (await res.json()) as { events?: SdbEvent[] | null };
  return json.events ?? [];
}

interface SdbTimeline {
  strTimeline?: string | null; // "Goal" | "Goal Penalty" | "Goal Own" | "Card" | "subst"...
  intTime?: string | null;
  strPlayer?: string | null;
  strTeam?: string | null;
}

/** Lấy danh sách bàn thắng (cầu thủ + phút) của 1 trận từ API timeline. */
async function fetchGoals(
  eventId: string,
  homeCode: string,
  awayCode: string,
): Promise<Goal[]> {
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/lookuptimeline.php?id=${eventId}`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { timeline?: SdbTimeline[] | null };
    const items = json.timeline ?? [];
    const goals: Goal[] = [];
    for (const it of items) {
      const t = (it.strTimeline ?? "").toLowerCase();
      if (!t.startsWith("goal")) continue;
      const minute = it.intTime ? parseInt(it.intTime, 10) : 0;
      const teamCode = codeOf(it.strTeam ?? undefined);
      const kind: Goal["kind"] = t.includes("pen")
        ? "penalty"
        : t.includes("own")
          ? "own"
          : "goal";
      goals.push({
        side: teamCode === awayCode ? "away" : "home",
        player: it.strPlayer ?? "—",
        minute: Number.isNaN(minute) ? 0 : minute,
        kind,
      });
    }
    return goals.sort((a, b) => a.minute - b.minute);
  } catch {
    return [];
  }
}

function statusFrom(s?: string | null): MatchStatus {
  const x = (s ?? "").toUpperCase();
  if (!x || x === "NS") return "upcoming";
  if (["FT", "AET", "PEN", "MATCH FINISHED", "FINISHED"].includes(x)) return "finished";
  return "live";
}

/** Chỗ trống knock-out ("W98", "L101") — chưa xác định đội. */
function isSlot(code: string): boolean {
  return /^[WL]\d+$/.test(code);
}

const KO_MINUTES = 155; // knock-out có thể tới hiệp phụ + luân lưu

/** Trạng thái theo giờ bóng lăn (chỉ khi đã đủ 2 đội thật). */
function timeStatus(kickoff: string, now: number): MatchStatus {
  const ko = new Date(kickoff).getTime();
  if (now >= ko + KO_MINUTES * 60_000) return "finished";
  if (now >= ko) return "live";
  return "upcoming";
}

const KO_STAGES: WikiRound[] = ["r32", "r16", "qf", "sf", "third", "final"];

/**
 * Điền dữ liệu sơ đồ Wikipedia vào các trận knock-out của lịch: thay chỗ trống
 * "W98"... bằng đội đã xác định, bổ sung tỉ số/luân lưu nếu lịch tĩnh chưa có.
 * Ghép theo VỊ TRÍ NHÁNH (thứ tự KO_RAW mỗi vòng = thứ tự nhánh Wikipedia).
 */
function applyBracketToFixtures(base: Match[], ties: WikiBracketTie[]): void {
  if (!ties.length) return;
  const byId = new Map(base.map((m) => [m.id, m]));
  const now = Date.now();

  for (const stage of KO_STAGES) {
    const slots = KO_RAW.filter((r) => r.s === stage);
    const roundTies = ties.filter((t) => t.round === stage);
    slots.forEach((raw, i) => {
      const t = roundTies[i];
      const m = byId.get(`M${raw.n}`);
      if (!t || !m) return;

      if (t.homeCode) m.homeCode = t.homeCode;
      if (t.awayCode) m.awayCode = t.awayCode;

      // Đủ 2 đội thật -> tính lại trạng thái theo giờ (lúc tạo lịch còn chỗ trống).
      if (!isSlot(m.homeCode) && !isSlot(m.awayCode) && m.status === "upcoming") {
        m.status = timeStatus(m.kickoff, now);
      }

      if (t.homeScore != null && t.awayScore != null && m.homeScore == null) {
        m.homeScore = t.homeScore;
        m.awayScore = t.awayScore;
        if (t.homePens != null && t.awayPens != null) {
          m.homePens = t.homePens;
          m.awayPens = t.awayPens;
        }
      }
    });
  }
}

/**
 * Lịch 104 trận (72 vòng bảng + 32 knock-out) + phủ dữ liệu thật, TỰ CẬP NHẬT:
 *  0. Sơ đồ Wikipedia: điền đội thắng vào các nhánh knock-out ("W98"...).
 *  1. TheSportsDB: tỉ số live + trạng thái + giờ chính xác.
 *  2. Wikipedia (nguồn chính): chốt tỉ số + cầu thủ ghi bàn các trận đã đá.
 *  3. Dự phòng: tỉ số tĩnh trong fixtures + danh sách ghi bàn nhập tay.
 * Mọi nguồn lỗi đều bỏ qua êm -> luôn trả về lịch (không bao giờ vỡ).
 */
export async function buildMergedMatches(): Promise<Match[]> {
  const base = getAllMatches();

  // --- Nguồn 0: sơ đồ Wikipedia -> chốt đội các nhánh knock-out ---
  try {
    applyBracketToFixtures(base, await fetchWikiBracket());
  } catch {
    // bỏ qua — chỗ trống hiển thị "Thắng trận N"
  }

  // --- Nguồn 1: TheSportsDB (live + trạng thái) ---
  let events: SdbEvent[] = [];
  try {
    events = await fetchSeasonEvents();
  } catch {
    events = [];
  }

  // Map mỗi trận theo cặp đội (không phân biệt sân nhà/khách). Tách vòng bảng và
  // knock-out vì 2 đội cùng bảng có thể gặp lại nhau ở knock-out.
  const groupIndex = new Map<string, Match>();
  const koIndex = new Map<string, Match>();
  for (const m of base) {
    (m.stage === "group" ? groupIndex : koIndex).set(
      [m.homeCode, m.awayCode].sort().join("-"),
      m,
    );
  }

  for (const e of events) {
    const hc = codeOf(e.strHomeTeam);
    const ac = codeOf(e.strAwayTeam);
    if (!hc || !ac) continue;
    const key = [hc, ac].sort().join("-");
    const fixture = roundKeyOf(e) ? koIndex.get(key) : groupIndex.get(key);
    if (!fixture) continue;

    if (e.idEvent) fixture.apiEventId = e.idEvent;

    // Giờ chính xác từ API (UTC).
    if (e.strTimestamp) {
      const iso = e.strTimestamp.endsWith("Z")
        ? e.strTimestamp
        : e.strTimestamp.replace(" ", "T") + "Z";
      fixture.kickoff = iso;
    }

    fixture.status = statusFrom(e.strStatus);

    const hs = e.intHomeScore != null ? parseInt(e.intHomeScore, 10) : null;
    const as = e.intAwayScore != null ? parseInt(e.intAwayScore, 10) : null;
    if (hs != null && as != null && !Number.isNaN(hs) && !Number.isNaN(as)) {
      // Định hướng tỉ số theo sân nhà/khách của lịch nội bộ.
      const apiHomeIsFixtureHome = codeOf(e.strHomeTeam) === fixture.homeCode;
      fixture.homeScore = apiHomeIsFixtureHome ? hs : as;
      fixture.awayScore = apiHomeIsFixtureHome ? as : hs;
      const prog = e.strProgress && /^\d+/.test(e.strProgress)
        ? parseInt(e.strProgress, 10)
        : undefined;
      if (fixture.status === "live" && prog) fixture.minute = prog;
    }
  }

  // --- Nguồn 2: Wikipedia (chốt tỉ số + cầu thủ ghi bàn cho trận ĐÃ ĐÁ) ---
  let wiki: Map<string, WikiMatch> = new Map();
  try {
    wiki = await fetchWikiResults();
  } catch {
    wiki = new Map();
  }
  let koWiki: Map<string, WikiMatch> = new Map();
  try {
    koWiki = await fetchWikiKnockoutResults();
  } catch {
    koWiki = new Map();
  }
  for (const m of base) {
    if (m.status === "live") continue; // đang đá -> để TheSportsDB lo tỉ số/phút
    // Tra đúng nguồn theo vòng (2 đội có thể gặp nhau cả vòng bảng lẫn knock-out).
    const w = (m.stage === "group" ? wiki : koWiki).get(
      pairKey(m.homeCode, m.awayCode),
    );
    if (!w) continue;
    const homeFirst = w.homeCode === m.homeCode;
    m.homeScore = homeFirst ? w.homeScore : w.awayScore;
    m.awayScore = homeFirst ? w.awayScore : w.homeScore;
    if (w.homePens != null && w.awayPens != null) {
      m.homePens = homeFirst ? w.homePens : w.awayPens;
      m.awayPens = homeFirst ? w.awayPens : w.homePens;
    }
    m.status = "finished";
    m.goals = w.goals
      .map((g) => {
        const side: Goal["side"] = homeFirst
          ? g.side
          : g.side === "home"
            ? "away"
            : "home";
        return { ...g, side };
      })
      .sort((a, b) => a.minute - b.minute);
  }

  // --- Nguồn 3 (dự phòng ghi bàn): override nhập tay, rồi timeline TheSportsDB ---
  for (const m of base) {
    if (!m.goals && GOAL_OVERRIDES[m.id])
      m.goals = [...GOAL_OVERRIDES[m.id]].sort((a, b) => a.minute - b.minute);
  }
  const needGoals = base.filter(
    (m) => !m.goals && m.apiEventId && (m.status === "finished" || m.status === "live"),
  );
  await Promise.all(
    needGoals.map(async (m) => {
      m.goals = await fetchGoals(m.apiEventId!, m.homeCode, m.awayCode);
    }),
  );

  return base.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

/* ------------------------- SƠ ĐỒ KNOCK-OUT (tự cập nhật) ------------------------- */

export type RoundKey = "r32" | "r16" | "qf" | "sf" | "third" | "final";

export interface KnockoutTie {
  homeCode: string | null;
  awayCode: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homePens: number | null; // luân lưu (nếu hòa sau hiệp phụ)
  awayPens: number | null;
  status: MatchStatus;
  kickoff: string | null;
}

export interface BracketData {
  rounds: Record<RoundKey, KnockoutTie[]>;
  champion: string | null;
}

// Mã vòng của TheSportsDB cho thể thức loại trực tiếp.
const ROUND_CODE: Record<string, RoundKey> = {
  "180": "r32", "170": "r16", "160": "qf", "150": "sf", "140": "third", "125": "final",
};

function roundKeyOf(e: SdbEvent): RoundKey | null {
  if (e.intRound && ROUND_CODE[e.intRound]) return ROUND_CODE[e.intRound];
  const s = `${e.strStage ?? ""} ${e.strEvent ?? ""}`.toLowerCase();
  if (/third|3rd|hạng ba|play-?off for third/.test(s)) return "third";
  if (/semi/.test(s)) return "sf";
  if (/quarter/.test(s)) return "qf";
  if (/round of 16|last 16|1\/8/.test(s)) return "r16";
  if (/round of 32|last 32|1\/16/.test(s)) return "r32";
  if (/\bfinal\b/.test(s)) return "final";
  return null;
}

function emptyRounds(): Record<RoundKey, KnockoutTie[]> {
  return { r32: [], r16: [], qf: [], sf: [], third: [], final: [] };
}

/** Đội thắng một nhánh (tính cả luân lưu); null nếu chưa xong/chưa rõ. */
export function tieWinner(t: KnockoutTie): string | null {
  if (t.status !== "finished" || t.homeScore == null || t.awayScore == null)
    return null;
  if (t.homeScore !== t.awayScore)
    return t.homeScore > t.awayScore ? t.homeCode : t.awayCode;
  if (t.homePens != null && t.awayPens != null && t.homePens !== t.awayPens)
    return t.homePens > t.awayPens ? t.homeCode : t.awayCode;
  return null;
}

/**
 * Sơ đồ loại trực tiếp: khung 32 trận tĩnh (đủ tới chung kết, đúng thứ tự nhánh)
 * + TỰ CẬP NHẬT đội/tỉ số/luân lưu từ Wikipedia (RoundN) và TheSportsDB (live).
 */
export async function buildBracket(): Promise<BracketData> {
  const rounds = emptyRounds();
  const now = Date.now();

  // --- Khung tĩnh từ lịch knock-out (thứ tự nhánh chuẩn) ---
  for (const raw of KO_RAW) {
    const rk = raw.s as RoundKey;
    const home = isSlot(raw.h) ? null : raw.h;
    const away = isSlot(raw.a) ? null : raw.a;
    rounds[rk].push({
      homeCode: home,
      awayCode: away,
      homeScore: raw.hs ?? null,
      awayScore: raw.as ?? null,
      homePens: raw.hp ?? null,
      awayPens: raw.ap ?? null,
      status: home && away ? timeStatus(raw.ko, now) : "upcoming",
      kickoff: raw.ko,
    });
  }

  // --- Nguồn 1: sơ đồ Wikipedia (đội + tỉ số + luân lưu, theo vị trí nhánh) ---
  try {
    const ties = await fetchWikiBracket();
    for (const rk of KO_STAGES) {
      const roundTies = ties.filter((t) => t.round === rk);
      rounds[rk].forEach((tie, i) => {
        const t = roundTies[i];
        if (!t) return;
        if (t.homeCode) tie.homeCode = t.homeCode;
        if (t.awayCode) tie.awayCode = t.awayCode;
        if (tie.homeCode && tie.awayCode && tie.kickoff && tie.status === "upcoming") {
          tie.status = timeStatus(tie.kickoff, now);
        }
        if (t.homeScore != null && t.awayScore != null) {
          tie.homeScore = t.homeScore;
          tie.awayScore = t.awayScore;
          tie.homePens = t.homePens;
          tie.awayPens = t.awayPens;
          tie.status = "finished";
        }
      });
    }
  } catch {
    // bỏ qua — vẫn còn khung tĩnh + TheSportsDB
  }

  // --- Nguồn 2: TheSportsDB (tỉ số/trạng thái live) ---
  let events: SdbEvent[] = [];
  try {
    events = await fetchSeasonEvents();
  } catch {
    events = [];
  }
  for (const e of events) {
    const rk = roundKeyOf(e);
    if (!rk) continue;
    const hc = codeOf(e.strHomeTeam);
    const ac = codeOf(e.strAwayTeam);
    if (!hc || !ac) continue;
    const key = [hc, ac].sort().join("-");
    const tie = rounds[rk].find(
      (t) => t.homeCode && t.awayCode && [t.homeCode, t.awayCode].sort().join("-") === key,
    );
    if (!tie) continue;

    const status = statusFrom(e.strStatus);
    const hs = e.intHomeScore != null ? parseInt(e.intHomeScore, 10) : null;
    const as = e.intAwayScore != null ? parseInt(e.intAwayScore, 10) : null;
    if (status === "live" && hs != null && as != null && !Number.isNaN(hs) && !Number.isNaN(as)) {
      const apiHomeFirst = hc === tie.homeCode;
      tie.homeScore = apiHomeFirst ? hs : as;
      tie.awayScore = apiHomeFirst ? as : hs;
      tie.status = "live";
    }
    if (e.strTimestamp) {
      tie.kickoff = e.strTimestamp.endsWith("Z")
        ? e.strTimestamp
        : e.strTimestamp.replace(" ", "T") + "Z";
    }
  }

  // Nhà vô địch = đội thắng chung kết (tính cả luân lưu).
  const fin = rounds.final[0];
  const champion = fin ? tieWinner(fin) : null;

  return { rounds, champion };
}
