import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Verify your email",
  description: "Verify the email address for your ZANCTA account.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
