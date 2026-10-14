import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "кварта — мастерская обжарки кофе в Минске",
    template: "%s · кварта",
  },
  description:
    "Маленькая мастерская обжарки кофе в Минске: обжариваем партиями по 5 кг, по четвергам, а по пятницам развозим по городу. Зерно у вас на 1–3 день после обжарки.",
  keywords: [
    "кофе в зерне Минск",
    "обжарка кофе Минск",
    "свежеобжаренный кофе",
    "подписка на кофе",
    "дрип-пакеты",
  ],
  openGraph: {
    type: "website",
    locale: "ru_BY",
    url: siteUrl,
    siteName: "кварта",
    title: "кварта — мастерская обжарки кофе в Минске",
    description:
      "Обжариваем кофе партиями по 5 кг и развозим по Минску в пятницу. Свежесть — то, что мы продаём.",
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-cream text-ink">{children}</body>
    </html>
  );
}
