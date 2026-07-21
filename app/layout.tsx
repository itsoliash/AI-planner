import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Planner — розбір голосу в задачі",
  description: "Прототип: український текст → структуровані задачі (JSON)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
