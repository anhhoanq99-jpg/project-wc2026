import Link from "next/link";
import { ListChecks, BarChart3 } from "lucide-react";
import { Hero } from "@/components/hero";
import { ProfileBar } from "@/components/profile-bar";
import { MyTeam } from "@/components/my-team";
import { TodayBoard } from "@/components/today-board";
import { ScheduleList } from "@/components/schedule-list";
import { HowToPlay } from "@/components/how-to-play";
import { Reveal } from "@/components/reveal";

export default function HomePage() {
  return (
    <>
      <Hero />

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        <ProfileBar />

        {/* GHIM ĐẦU TRANG: trận hôm nay + ngày mai */}
        <TodayBoard />

        {/* Cá nhân hóa: đội tuyển yêu thích */}
        <MyTeam />

        {/* Lịch thi đấu đầy đủ */}
        <section id="lich-dau" className="scroll-mt-20">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl">
              <ListChecks className="h-6 w-6 text-brand" />
              Lịch thi đấu
            </h2>
            <Link
              href="/bang-xep-hang"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"
            >
              <BarChart3 className="h-4 w-4" />
              Xếp hạng
            </Link>
          </div>
          <ScheduleList />
        </section>

        <HowToPlay />

        <Reveal>
          <div className="rounded-2xl border border-border bg-surface/50 p-8 text-center">
            <h2 className="text-xl font-extrabold sm:text-2xl">Sẵn sàng so tài?</h2>
            <p className="mx-auto mt-2 max-w-md text-muted">
              Dự đoán càng nhiều, điểm càng cao. Lên đỉnh bảng xếp hạng nào!
            </p>
            <Link
              href="/bang-xep-hang"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-[#04130b] hover:brightness-110"
            >
              <BarChart3 className="h-5 w-5" />
              Xem bảng xếp hạng
            </Link>
          </div>
        </Reveal>
      </div>
    </>
  );
}
