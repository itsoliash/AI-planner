import type { MetadataRoute } from "next";

// Мінімальна PWA-оболонка (ТЗ розділ 5) — маніфест + теплі світлі кольори.
// Без service worker і apple-splash — це більший обсяг робіт за межами
// цього ТЗ (див. docs/redesign-plan.md, крок 8).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zmotano",
    short_name: "Zmotano",
    description: "Наговори або встав текст → отримай структуровані задачі.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF7F0",
    theme_color: "#FFF7F0",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
