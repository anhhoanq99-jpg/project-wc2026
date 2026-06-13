import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GitFork } from "lucide-react";
import { Bracket } from "@/components/bracket";

export const metadata: Metadata = {
  title: "Sơ đồ vòng loại trực tiếp · Cúp Thế Giới 2026",
  description: "Sơ đồ các cặp đấu từ vòng 1/16 tới chung kết và nhà vô địch World Cup 2026.",
};

export default function BracketPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Về trang chủ
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
          <GitFork className="h-7 w-7 rotate-90 text-brand" />
          Sơ đồ tới chức vô địch
        </h1>
        <p className="mt-2 text-muted">
          Đường tới ngôi vương: vòng 1/16 → 1/8 → tứ kết → bán kết → chung kết. Các đội
          được điền dần sau khi vòng bảng kết thúc.
        </p>
      </div>

      <Bracket />
    </div>
  );
}
