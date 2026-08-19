import type { Metadata } from "next";
import "../[locale]/globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "관리자 - NexaLab",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <div className={styles.appContainer}>{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
