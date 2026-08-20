import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "GlucoseOnline — Обучение кураторов",
  description:
    "Платформа обучения кураторов GlucoseOnline. Видео-уроки, тесты и заявка на доступ к admin.glucoseonline.kz",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${geist.variable} antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
