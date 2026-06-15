import { cn } from "@/lib/utils";

/** Vòng xoay loading nhỏ gọn, kế thừa màu chữ hiện tại (currentColor). */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Đang tải"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
