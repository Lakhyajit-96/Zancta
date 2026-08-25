import type { Metadata } from "next";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/verify-email" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
