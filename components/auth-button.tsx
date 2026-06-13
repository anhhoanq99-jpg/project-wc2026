"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { AuthModal } from "@/components/auth-modal";

/** Nút đăng nhập / hiển thị tài khoản trong header. */
export function AuthButton() {
  const { user, status, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (status === "loading") {
    return <span className="h-9 w-20 animate-pulse rounded-md bg-surface-2" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold">
          <span className="text-base">{user.avatar || <User className="h-4 w-4" />}</span>
          <span className="max-w-[8rem] truncate">{user.name}</span>
        </span>
        <button
          type="button"
          onClick={logout}
          aria-label="Đăng xuất"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted hover:bg-surface hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-[#04130b] hover:brightness-110"
      >
        <LogIn className="h-4 w-4" />
        Đăng nhập
      </motion.button>
      <AnimatePresence>
        {open && <AuthModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
