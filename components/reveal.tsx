"use client";

import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** true sau khi mount ở client (false khi SSR) — không cần setState trong effect. */
const subscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

/**
 * Hiện dần khi cuộn tới. Luôn render cùng một phần tử (motion.div) ở cả SSR và
 * client để tránh hydration mismatch; chỉ tắt chuyển động sau khi mount nếu người
 * dùng bật prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const mounted = useIsClient();

  const instant = mounted && reduce;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: instant ? 0 : 0.5, delay: instant ? 0 : delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
