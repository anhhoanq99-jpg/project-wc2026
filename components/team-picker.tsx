"use client";

import { X, Check, Heart } from "lucide-react";
import { TEAMS } from "@/lib/data/teams";
import { Flag } from "@/components/flag";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

const GROUPS = [...new Set(TEAMS.map((t) => t.group))].filter(Boolean) as string[];

/** Modal chọn đội tuyển quốc gia yêu thích (xếp theo bảng A–L). */
export function TeamPicker({
  value,
  onPick,
  onClose,
}: {
  value?: string;
  onPick: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      onClose={onClose}
      placement="sheet"
      ariaLabel="Chọn đội tuyển yêu thích"
      panelClassName="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="flex items-center gap-2 font-bold">
          <Heart className="h-5 w-5 text-live" />
          Chọn đội tuyển yêu thích
        </p>
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-y-auto p-4">
        {GROUPS.map((g) => (
          <div key={g} className="mb-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
              Bảng {g}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TEAMS.filter((t) => t.group === g).map((t) => {
                const active = value === t.code;
                return (
                  <button
                    key={t.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onPick(t.code)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                      active
                        ? "border-brand bg-brand/15 text-brand"
                        : "border-border hover:bg-surface-2",
                    )}
                  >
                    <Flag code={t.code} size={22} />
                    <span className="flex-1 truncate">{t.name}</span>
                    {active && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
