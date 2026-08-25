import type { Metadata } from "next";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/reset-password" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
