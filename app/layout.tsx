import type { Metadata } from "next";
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
    icon: "/favicon-zancta.svg",
    apple: "/favicon-zancta.svg",
  },
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
