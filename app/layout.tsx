import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "LocalFile — Privacy-first file tools. Your files never leave your device.",
    template: "%s — LocalFile",
  },
  description:
    "Merge, split, compress PDFs and images privately in your browser. No upload, no watermark, no signup. 10 local-first tools.",
  openGraph: {
    title: "LocalFile — Your files never leave your device",
    description: "Privacy-first PDF & image tools that run entirely in your browser.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LocalFile — Privacy-first file tools",
    description: "Local processing. No upload. No watermark.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
