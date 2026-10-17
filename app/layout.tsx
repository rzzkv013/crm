import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduNova CRM — demo",
  description: "O‘quv markazlari uchun lokal EduNova CRM demo platformasi",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="uz" suppressHydrationWarning><body>{children}</body></html>;
}
