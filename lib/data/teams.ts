import type { Team } from "@/lib/types";

/**
 * 48 đội World Cup 2026, 12 bảng A–L (theo dữ liệu lịch công khai trên Google
 * — Al Jazeera/ESPN/FIFA...). Tên tiếng Việt + emoji cờ (không dùng logo FIFA).
 */
export const TEAMS: Team[] = [
  // Bảng A
  { code: "MEX", name: "Mexico", flag: "🇲🇽", iso2: "mx", group: "A" },
  { code: "RSA", name: "Nam Phi", flag: "🇿🇦", iso2: "za", group: "A" },
  { code: "KOR", name: "Hàn Quốc", flag: "🇰🇷", iso2: "kr", group: "A" },
  { code: "CZE", name: "Séc", flag: "🇨🇿", iso2: "cz", group: "A" },
  // Bảng B
  { code: "CAN", name: "Canada", flag: "🇨🇦", iso2: "ca", group: "B" },
  { code: "BIH", name: "Bosnia & Herzegovina", flag: "🇧🇦", iso2: "ba", group: "B" },
  { code: "QAT", name: "Qatar", flag: "🇶🇦", iso2: "qa", group: "B" },
  { code: "SUI", name: "Thụy Sĩ", flag: "🇨🇭", iso2: "ch", group: "B" },
  // Bảng C
  { code: "BRA", name: "Brazil", flag: "🇧🇷", iso2: "br", group: "C" },
  { code: "MAR", name: "Maroc", flag: "🇲🇦", iso2: "ma", group: "C" },
  { code: "HAI", name: "Haiti", flag: "🇭🇹", iso2: "ht", group: "C" },
  { code: "SCO", name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", iso2: "gb-sct", group: "C" },
  // Bảng D
  { code: "USA", name: "Hoa Kỳ", flag: "🇺🇸", iso2: "us", group: "D" },
  { code: "PAR", name: "Paraguay", flag: "🇵🇾", iso2: "py", group: "D" },
  { code: "AUS", name: "Úc", flag: "🇦🇺", iso2: "au", group: "D" },
  { code: "TUR", name: "Thổ Nhĩ Kỳ", flag: "🇹🇷", iso2: "tr", group: "D" },
  // Bảng E
  { code: "GER", name: "Đức", flag: "🇩🇪", iso2: "de", group: "E" },
  { code: "CUW", name: "Curaçao", flag: "🇨🇼", iso2: "cw", group: "E" },
  { code: "CIV", name: "Bờ Biển Ngà", flag: "🇨🇮", iso2: "ci", group: "E" },
  { code: "ECU", name: "Ecuador", flag: "🇪🇨", iso2: "ec", group: "E" },
  // Bảng F
  { code: "NED", name: "Hà Lan", flag: "🇳🇱", iso2: "nl", group: "F" },
  { code: "JPN", name: "Nhật Bản", flag: "🇯🇵", iso2: "jp", group: "F" },
  { code: "SWE", name: "Thụy Điển", flag: "🇸🇪", iso2: "se", group: "F" },
  { code: "TUN", name: "Tunisia", flag: "🇹🇳", iso2: "tn", group: "F" },
  // Bảng G
  { code: "BEL", name: "Bỉ", flag: "🇧🇪", iso2: "be", group: "G" },
  { code: "EGY", name: "Ai Cập", flag: "🇪🇬", iso2: "eg", group: "G" },
  { code: "IRN", name: "Iran", flag: "🇮🇷", iso2: "ir", group: "G" },
  { code: "NZL", name: "New Zealand", flag: "🇳🇿", iso2: "nz", group: "G" },
  // Bảng H
  { code: "ESP", name: "Tây Ban Nha", flag: "🇪🇸", iso2: "es", group: "H" },
  { code: "CPV", name: "Cabo Verde", flag: "🇨🇻", iso2: "cv", group: "H" },
  { code: "SAU", name: "Ả Rập Xê Út", flag: "🇸🇦", iso2: "sa", group: "H" },
  { code: "URY", name: "Uruguay", flag: "🇺🇾", iso2: "uy", group: "H" },
  // Bảng I
  { code: "FRA", name: "Pháp", flag: "🇫🇷", iso2: "fr", group: "I" },
  { code: "SEN", name: "Senegal", flag: "🇸🇳", iso2: "sn", group: "I" },
  { code: "IRQ", name: "Iraq", flag: "🇮🇶", iso2: "iq", group: "I" },
  { code: "NOR", name: "Na Uy", flag: "🇳🇴", iso2: "no", group: "I" },
  // Bảng J
  { code: "ARG", name: "Argentina", flag: "🇦🇷", iso2: "ar", group: "J" },
  { code: "ALG", name: "Algeria", flag: "🇩🇿", iso2: "dz", group: "J" },
  { code: "AUT", name: "Áo", flag: "🇦🇹", iso2: "at", group: "J" },
  { code: "JOR", name: "Jordan", flag: "🇯🇴", iso2: "jo", group: "J" },
  // Bảng K
  { code: "POR", name: "Bồ Đào Nha", flag: "🇵🇹", iso2: "pt", group: "K" },
  { code: "COD", name: "CHDC Congo", flag: "🇨🇩", iso2: "cd", group: "K" },
  { code: "UZB", name: "Uzbekistan", flag: "🇺🇿", iso2: "uz", group: "K" },
  { code: "COL", name: "Colombia", flag: "🇨🇴", iso2: "co", group: "K" },
  // Bảng L
  { code: "ENG", name: "Anh", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", iso2: "gb-eng", group: "L" },
  { code: "CRO", name: "Croatia", flag: "🇭🇷", iso2: "hr", group: "L" },
  { code: "GHA", name: "Ghana", flag: "🇬🇭", iso2: "gh", group: "L" },
  { code: "PAN", name: "Panama", flag: "🇵🇦", iso2: "pa", group: "L" },
];

const TEAM_MAP: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.code, t]),
);

export function getTeam(code: string): Team {
  const t = TEAM_MAP[code];
  if (t) return t;
  // Chỗ trống knock-out: "W98" = thắng trận 98, "L101" = thua trận 101.
  const slot = code.match(/^([WL])(\d+)$/);
  if (slot) {
    const label = slot[1] === "W" ? "Thắng trận" : "Thua trận";
    return { code, name: `${label} ${slot[2]}`, flag: "❔", iso2: "" };
  }
  return { code, name: code, flag: "🏳️", iso2: "" };
}
