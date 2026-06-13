"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Hiệu ứng chuyển trang nhẹ (chỉ fade opacity — không transform để tránh tạo
 * containing-block làm lệch modal fixed). Luôn render cùng một phần tử ở SSR và
 * client để KHÔNG gây hydration mismatch.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
