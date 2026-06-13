import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { ProfileBar } from "@/components/profile-bar";
import { HistoryView } from "@/components/history-view";

export const metadata: Metadata = {
  title: "Lịch sử & Thống kê · Cúp Thế Giới 2026",
  description: "Lịch sử đặt cược, phân tích thông minh, dự đoán giỏi nhất và đánh giá người chơi.",
};

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Về trang chủ
      </Link>

      <h1 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
        <History className="h-7 w-7 text-brand" />
        Lịch sử & Thống kê
      </h1>

      <ProfileBar />
      <HistoryView />
    </div>
  );
}
