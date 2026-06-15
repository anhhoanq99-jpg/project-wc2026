import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/70 bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Chơi vui bằng <strong className="text-foreground">điểm thưởng</strong> —
            hoàn toàn miễn phí, không tiền thật.
          </p>
          <p>© {new Date().getFullYear()} · Trang fan phi thương mại</p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted/80">
          Trang cổ vũ xem World Cup văn minh, độc lập, không liên kết với FIFA hay bất
          kỳ tổ chức nào. Không dùng logo/biểu tượng chính thức. Lịch thi đấu hiện là
          <strong> dữ liệu mẫu</strong> phục vụ chơi thử.
        </p>
      </div>
    </footer>
  );
}
