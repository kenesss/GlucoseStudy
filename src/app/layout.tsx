import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "GlucoseOnline — Кураторларды оқыту",
  description:
    "GlucoseOnline кураторларын оқыту платформасы. Бейнесабақтар, тесттер және admin.glucoseonline.kz қолжетімділігіне өтінім",
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
    <html lang="kk">
      <body className={`${geist.variable} antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
