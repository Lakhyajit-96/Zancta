import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { PUBLIC_SITE_URL } from "@/lib/seo";
import { ConsentAndAnalytics } from "@/components/consent-and-analytics";

const geistMono = localFont({
  variable: "--font-geist-mono",
  src: "./fonts/geist-mono-latin.woff2",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: {
    default: "ZANCTA — PDF and image tools that run in your browser",
    template: "%s — ZANCTA",
  },
  description:
    "Process supported PDFs and images locally in your browser. No file upload for implemented local workflows.",
  icons: {
    icon: [
      { url: "/icons/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: { url: "/icons/favicon-180.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "ZANCTA — PDF and image tools that run in your browser",
    description: "Implemented local workflows process the selected file in your browser. No file upload for processing.",
    siteName: "ZANCTA",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/assets/zancta-brand/og-images/zancta-og-hero.png",
        width: 1200,
        height: 630,
        alt: "ZANCTA — local PDF and image tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZANCTA — Local PDF and image tools",
    description: "Implemented local processing. No upload for supported tools. No watermark.",
    images: ["/assets/zancta-brand/og-images/zancta-og-hero.png"],
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#100f11",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <ConsentAndAnalytics />
      </body>
    </html>
  );
}
