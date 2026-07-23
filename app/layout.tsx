import type { Metadata } from "next";
import { Onest, JetBrains_Mono, Caveat } from "next/font/google";
import "./globals.css";

// Українська кирилиця в обох шрифтах — щоб title/notes/дати рендерились
// без фолбеку на системний шрифт.
const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Тільки для назви бренду "Zmotano" біля лого — латиниця, кирилиця не потрібна.
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zmotano — розбір голосу в задачі",
  description: "Прототип: український текст → структуровані задачі (JSON)",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zmotano",
  },
};

export const viewport = {
  themeColor: "#FFF7F0",
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="uk"
      className={`${onest.variable} ${jetbrainsMono.variable} ${caveat.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
