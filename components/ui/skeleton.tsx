import { cn } from "@/lib/utils";

/** Khối giữ chỗ nhấp nháy trong lúc chờ dữ liệu. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-2", className)} />;
}
