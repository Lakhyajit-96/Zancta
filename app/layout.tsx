import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/fraunces";
import "./globals.css";
import { PUBLIC_SITE_URL } from "@/lib/seo";
import { ConsentAndAnalytics } from "@/components/consent-and-analytics";
import { TrackPageView } from "@/components/analytics/track-page-view";

const geistMono = localFont({
  variable: "--font-geist-mono",
  src: "./fonts/geist-mono-latin.woff2",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: {
    default: "ZANCTA — PDF & Image Tools That Run in Your Browser",
    template: "%s — ZANCTA",
  },
  description:
    "Eleven browser-based PDF and image tools. Merge, compress, convert, resize, and OCR locally in this browser — no upload for supported processing. Free to use without an account.",
  icons: {
    icon: [
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/favicon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "ZANCTA — PDF & Image Tools That Run in Your Browser",
    description: "Eleven browser-based PDF and image tools with local processing. No upload for supported workflows. Free to use without an account.",
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
    title: "ZANCTA — PDF & Image Tools That Run in Your Browser",
    description: "Eleven local PDF and image tools. Merge, compress, convert, resize, and OCR in this browser.",
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
        <TrackPageView />
        <ConsentAndAnalytics />
      </body>
    </html>
  );
}
