import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "لوحة تحكم الكلّية العليا للحديث النبوي",
  description: "لوحة إدارة محتوى الموقع",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
