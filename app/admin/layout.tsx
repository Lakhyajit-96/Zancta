import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { previewProductionDataBlocked } from "@/lib/preview-isolation";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Admin",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (previewProductionDataBlocked()) redirect("/");

  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const entitlement = await prisma.entitlement.findUnique({
    where: { userId: session.user.id },
    select: { plan: true },
  });

  if (entitlement?.plan !== "ADMIN") redirect("/account");

  return <>{children}</>;
}
