import Link from "next/link";
import { CalendarDays, Sparkles, ShieldCheck, Trophy } from "lucide-react";
import { Reveal } from "@/components/reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/70">
      {/* nền gradient sân vận động */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, color-mix(in oklab, var(--brand) 22%, transparent), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand">
            <Sparkles className="h-4 w-4" />
            Mùa hè bóng đá 2026 · 48 đội · 104 trận
          </span>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Xem World Cup <span className="text-brand">văn minh</span>,
            <br className="hidden sm:block" /> dự đoán <span className="text-accent">cho vui</span>.
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Lịch thi đấu đầy đủ, trận hôm nay nhắc ngay đầu trang, và đủ các kiểu kèo
            dự đoán hấp dẫn — chơi bằng <strong className="text-foreground">điểm ảo</strong>,
            tuyệt đối <strong className="text-foreground">không tiền, không cá độ</strong>.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#hom-nay"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-semibold text-[#04130b] shadow-lg shadow-brand/20 transition-transform duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-95"
            >
              <CalendarDays className="h-5 w-5" />
              Xem trận hôm nay
            </Link>
            <Link
              href="#cach-choi"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 font-semibold text-foreground transition-transform duration-200 hover:scale-[1.03] hover:bg-surface active:scale-95"
            >
              <Trophy className="h-5 w-5" />
              Cách chơi dự đoán
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mt-8 inline-flex items-center gap-2 text-sm text-muted">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Nói không với cờ bạc — hấp dẫn như cá độ nhưng 0 đồng.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
