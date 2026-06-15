import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/components/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Onboarding } from "@/components/onboarding";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Cúp Thế Giới 2026 — Lịch đấu & Dự đoán vui",
  description:
    "Theo dõi World Cup 2026 văn minh: lịch thi đấu, trận hôm nay nhắc nhở, dự đoán tỉ số bằng điểm thưởng — vui, hấp dẫn & hoàn toàn miễn phí.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnam.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Skip-link: người dùng bàn phím nhấn Tab đầu tiên để nhảy thẳng tới nội dung. */}
        <a
          href="#main"
          className="sr-only rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Bỏ qua tới nội dung
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ToastProvider>
            <AuthProvider>
              <SiteHeader />
              <main id="main" className="flex-1">
                {children}
              </main>
              <SiteFooter />
              <Onboarding />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
