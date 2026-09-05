import type { Metadata } from "next";
import { LayoutChrome } from "@/components/layout/chrome";
export const metadata: Metadata = {
  title: "Account",
  description: "Manage your ZANCTA account and Premium subscription status.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) { 
  return <LayoutChrome>{children}</LayoutChrome>; 
}
