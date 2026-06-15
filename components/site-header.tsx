"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthButton } from "@/components/auth-button";

const NAV = [
  { href: "/#hom-nay", label: "Hôm nay" },
  { href: "/#lich-dau", label: "Lịch đấu" },
  { href: "/so-do", label: "Sơ đồ" },
  { href: "/lich-su", label: "Lịch sử dự đoán" },
  { href: "/bang-xep-hang", label: "Bảng xếp hạng" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/15 text-brand">
            <Trophy className="h-5 w-5" />
          </span>
          <span>
            Cúp Thế Giới <span className="text-brand">2026</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {n.label}
            </Link>
          ))}
          <ThemeToggle className="ml-1" />
          <AuthButton />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <AuthButton />
          <ThemeToggle />
          <motion.button
            type="button"
            aria-label="Mở menu"
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-menu"
            className="overflow-hidden border-t border-border/70 md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
              {NAV.map((n, i) => (
                <motion.div
                  key={n.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i }}
                >
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 text-sm font-medium text-muted hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
