import type { Match, MatchStatus, Goal } from "@/lib/types";
import { getAllMatches } from "@/lib/data/fixtures";
import { GOAL_OVERRIDES } from "@/lib/data/goal-overrides";

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

/** Lịch 72 trận + phủ dữ liệu thật từ API. Lỗi mạng -> trả lịch tĩnh. */
export async function buildMergedMatches(): Promise<Match[]> {
  const base = getAllMatches();

  let events: SdbEvent[] = [];
  try {
    events = await fetchSeasonEvents();
  } catch {
    return base; // offline -> lịch tĩnh, trạng thái tính theo giờ
  }

  // Map mỗi trận theo cặp đội (không phân biệt sân nhà/khách).
  const index = new Map<string, Match>();
  for (const m of base) index.set([m.homeCode, m.awayCode].sort().join("-"), m);

  for (const e of events) {
    const hc = codeOf(e.strHomeTeam);
    const ac = codeOf(e.strAwayTeam);
    if (!hc || !ac) continue;
    const fixture = index.get([hc, ac].sort().join("-"));
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

  // Ưu tiên danh sách ghi bàn nhập tay (đầy đủ + khớp tỉ số) nếu có.
  for (const m of base) {
    if (GOAL_OVERRIDES[m.id]) m.goals = [...GOAL_OVERRIDES[m.id]].sort((a, b) => a.minute - b.minute);
  }

  // Phần còn lại: phủ bàn thắng từ API cho trận đã/đang đá có sự kiện.
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

/** Sơ đồ loại trực tiếp lấy từ API, TỰ CẬP NHẬT khi có kết quả. */
export async function buildBracket(): Promise<BracketData> {
  let events: SdbEvent[] = [];
  try {
    events = await fetchSeasonEvents();
  } catch {
    return { rounds: emptyRounds(), champion: null };
  }

  const rounds = emptyRounds();
  for (const e of events) {
    const rk = roundKeyOf(e);
    if (!rk) continue;
    const hs = e.intHomeScore != null ? parseInt(e.intHomeScore, 10) : null;
    const as = e.intAwayScore != null ? parseInt(e.intAwayScore, 10) : null;
    rounds[rk].push({
      homeCode: codeOf(e.strHomeTeam),
      awayCode: codeOf(e.strAwayTeam),
      homeScore: hs != null && !Number.isNaN(hs) ? hs : null,
      awayScore: as != null && !Number.isNaN(as) ? as : null,
      status: statusFrom(e.strStatus),
      kickoff: e.strTimestamp
        ? e.strTimestamp.endsWith("Z")
          ? e.strTimestamp
          : e.strTimestamp.replace(" ", "T") + "Z"
        : null,
    });
  }

  // Xác định nhà vô địch nếu chung kết đã xong.
  let champion: string | null = null;
  const fin = rounds.final[0];
  if (
    fin &&
    fin.status === "finished" &&
    fin.homeScore != null &&
    fin.awayScore != null &&
    fin.homeScore !== fin.awayScore
  ) {
    champion = fin.homeScore > fin.awayScore ? fin.homeCode : fin.awayCode;
  }

  return { rounds, champion };
}
