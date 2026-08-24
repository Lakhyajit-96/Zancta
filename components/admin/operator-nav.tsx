"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/growth", label: "Growth" },
  { href: "/admin/integrations", label: "Integrations" },
] as const;

function active(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OperatorNav() {
  const pathname = usePathname() || "/admin";
  return (
    <nav
      aria-label="Operator"
      className="border-b border-border bg-elevated/60"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-5 py-2 md:px-8">
        <p className="mr-4 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
          ZANCTA ADMIN
        </p>
        {ITEMS.map((item) => {
          const isActive = active(pathname, item.href, "exact" in item && item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
