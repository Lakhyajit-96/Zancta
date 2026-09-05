import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a ZANCTA account for account settings and Premium status.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
