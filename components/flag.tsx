import { getTeam } from "@/lib/data/teams";
import { cn } from "@/lib/utils";

/**
 * Lá cờ quốc gia bằng ẢNH (flagcdn.com, mã nguồn mở) thay vì emoji —
 * vì Windows không hiển thị emoji cờ. Nhận mã đội nội bộ (vd "BRA").
 */
export function Flag({
  code,
  className,
  size = 28,
}: {
  code: string;
  className?: string;
  size?: number;
}) {
  const team = getTeam(code);

  // Không có iso -> dùng emoji làm fallback.
  if (!team.iso2) {
    return (
      <span style={{ fontSize: size * 0.8 }} aria-label={team.name}>
        {team.flag}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${team.iso2}.svg`}
      alt={`Cờ ${team.name}`}
      width={size}
      height={Math.round((size * 3) / 4)}
      loading="lazy"
      className={cn(
        "inline-block shrink-0 rounded-[3px] object-cover ring-1 ring-black/10 dark:ring-white/15",
        className,
      )}
      style={{ width: size, height: Math.round((size * 3) / 4) }}
    />
  );
}
