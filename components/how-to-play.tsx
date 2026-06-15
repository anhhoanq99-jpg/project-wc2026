import { ShieldCheck, Fish, TrendingUp, RotateCcw } from "lucide-react";
import { MARKETS, STARTING_BALANCE } from "@/lib/data/markets";
import { fmtWC, fmtDeltaShort } from "@/lib/format";
import { Reveal } from "@/components/reveal";

export function HowToPlay() {
  const steps = [
    {
      icon: <Fish className="h-5 w-5" />,
      title: `Bắt đầu với ${fmtWC(STARTING_BALANCE)}`,
      desc: "Mỗi người chơi có sẵn một số điểm thưởng để dự đoán các trận.",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Đúng → cộng, Sai → trừ",
      desc: "Dự đoán càng khó thưởng càng cao. Đoán bừa sẽ mất điểm — chọn chắc chắn để leo hạng.",
    },
    {
      icon: <RotateCcw className="h-5 w-5" />,
      title: "Hết điểm được hồi lại",
      desc: `Hết điểm sẽ được hồi về ${fmtWC(STARTING_BALANCE)} để chơi tiếp, nhưng phần hồi bị TRỪ vào tổng điểm (tổng điểm có thể âm).`,
    },
  ];

  return (
    <section id="cach-choi" className="scroll-mt-20">
      <Reveal>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Cách chơi dự đoán</h2>
          <p className="mx-auto mt-2 inline-flex max-w-xl items-center gap-2 text-muted">
            <ShieldCheck className="h-4 w-4 shrink-0 text-brand" />
            Hồi hộp &amp; vui — chơi hoàn toàn bằng điểm thưởng, không một đồng tiền thật.
          </p>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.05}>
            <div className="h-full rounded-xl border border-border bg-surface/70 p-5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/15 text-brand">
                {s.icon}
              </span>
              <p className="mt-3 font-bold">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <div className="mt-6 rounded-xl border border-border bg-surface/40 p-5">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
            Mức thưởng / phạt mỗi dự đoán
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2/60 text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Loại dự đoán</th>
                  <th className="px-3 py-2 text-right font-semibold">Đúng</th>
                  <th className="px-3 py-2 text-right font-semibold">Sai</th>
                </tr>
              </thead>
              <tbody>
                {MARKETS.map((mk) => (
                  <tr key={mk.id} className="border-t border-border/60">
                    <td className="px-3 py-2">{mk.name}</td>
                    <td className="px-3 py-2 text-right font-bold text-brand">
                      {fmtDeltaShort(mk.points)}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-danger">
                      {fmtDeltaShort(-mk.penalty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Điểm chỉ cộng/trừ khi trận <strong>kết thúc</strong>. Trận chưa đá = đang chờ,
            chưa ảnh hưởng số dư.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
