import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { PUBLIC_SITE_URL } from "@/lib/seo";

const geistSans = localFont({
  variable: "--font-geist-sans",
  src: "./fonts/geist-latin.woff2",
  display: "swap",
});

const geistMono = localFont({
  variable: "--font-geist-mono",
  src: "./fonts/geist-mono-latin.woff2",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: {
    default: "ZANCTA — Privacy-first file tools. Your files never leave your device.",
    template: "%s — ZANCTA",
  },
  description:
    "Process supported PDFs and images locally in your browser. No file upload for implemented local workflows.",
  icons: {
    icon: "/favicon-zancta.svg",
    apple: "/favicon-zancta.svg",
  },
  openGraph: {
    title: "ZANCTA — Your files never leave your device",
    description: "Privacy-first PDF & image tools that run entirely in your browser.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/assets/zancta-brand/og-images/zancta-og-hero.png",
        width: 1200,
        height: 630,
        alt: "ZANCTA — privacy-first file tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZANCTA — Privacy-first file tools",
    description: "Local processing. No upload. No watermark.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
