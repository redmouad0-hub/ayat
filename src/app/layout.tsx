import type { Metadata } from "next";
import { Amiri } from "next/font/google";
import "./globals.css";

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});

export const metadata: Metadata = {
  title: "آيات | صوت القرآن الكريم",
  description:
    "استمع إلى تلاوات القرآن الكريم، واختر قارئك وروايتك والسورة التي تحب.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={amiri.variable}>{children}</body>
    </html>
  );
}
