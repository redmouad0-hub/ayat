import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
