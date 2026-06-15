"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Placement = "center" | "sheet";

/**
 * Ngăn xếp modal đang mở: khi modal lồng nhau (vd onboarding → auth → chọn đội),
 * chỉ modal TRÊN CÙNG phản hồi Escape & bẫy Tab, tránh đóng nhầm tất cả.
 */
const modalStack: object[] = [];

/**
 * Khung modal dùng chung: render qua portal, khoá cuộn nền, đóng bằng Escape
 * hoặc click ra ngoài, bẫy focus (Tab không thoát ra ngoài) — gom phần lặp của
 * auth-modal / prediction-sheet / onboarding / team-picker và bổ sung a11y bàn phím.
 *
 * Bọc trong <AnimatePresence> ở phía gọi để có hiệu ứng thoát.
 */
export function Modal({
  onClose,
  children,
  placement = "center",
  panelClassName,
  ariaLabel,
}: {
  onClose: () => void;
  children: React.ReactNode;
  placement?: Placement;
  panelClassName?: string;
  ariaLabel?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<object>({});

  useEffect(() => {
    const token = tokenRef.current;
    modalStack.push(token);

    const isTop = () => modalStack[modalStack.length - 1] === token;

    const onKey = (e: KeyboardEvent) => {
      if (!isTop()) return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      const i = modalStack.indexOf(token);
      if (i !== -1) modalStack.splice(i, 1);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const isSheet = placement === "sheet";

  return createPortal(
    <motion.div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-black/70 p-4",
        isSheet ? "items-end p-0 sm:items-center sm:p-4" : "items-center overflow-y-auto",
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          "border border-border bg-surface shadow-2xl outline-none",
          panelClassName,
        )}
        initial={isSheet ? { y: 40, opacity: 0 } : { y: 20, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={isSheet ? { y: 40, opacity: 0 } : { y: 20, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        {children}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
