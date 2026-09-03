import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZANCTA",
    short_name: "ZANCTA",
    description: "Browser-local PDF and image tools.",
    start_url: "/",
    display: "standalone",
    background_color: "#100f11",
    theme_color: "#100f11",
    id: "/",
    scope: "/",
    lang: "en",
    categories: ["utilities", "productivity"],
    icons: [
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { src: "/icons/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/favicon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/favicon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
