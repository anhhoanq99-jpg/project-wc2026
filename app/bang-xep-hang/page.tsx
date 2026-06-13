import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Leaderboard } from "@/components/leaderboard";
import { ProfileBar } from "@/components/profile-bar";

export const metadata: Metadata = {
  title: "Bảng xếp hạng · Cúp Thế Giới 2026",
  description: "So tài dự đoán bằng điểm ảo — vui & văn minh, không cờ bạc.",
};

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Về trang chủ
      </Link>

      <h1 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
        <BarChart3 className="h-7 w-7 text-brand" />
        Bảng xếp hạng
      </h1>

      <ProfileBar />
      <Leaderboard />
    </div>
  );
}
