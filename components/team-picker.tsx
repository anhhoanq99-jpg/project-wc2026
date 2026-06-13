"use client";

import { motion } from "framer-motion";
import { X, Check, Heart } from "lucide-react";
import { TEAMS } from "@/lib/data/teams";
import { Flag } from "@/components/flag";
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
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 28, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-surface-2"
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
                      onClick={() => onPick(t.code)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
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
      </motion.div>
    </motion.div>
  );
}
