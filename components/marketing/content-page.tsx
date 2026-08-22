import Link from "next/link";
import { Footer, Navigation } from "@/components/marketing/nav";
import { MaskLines } from "@/components/marketing/motion";

export function ContentPage({
  eyebrow,
  title,
  intro,
  visual,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro: string;
  visual?: React.ReactNode;
  crumbs?: Array<{ name: string; href?: string }>;
  children: React.ReactNode;
}) {
  const isPath = eyebrow?.startsWith("/");

  return (
    <>
      <Navigation />
      <main className="relative overflow-hidden">
        <section className="relative mx-auto max-w-[80rem] px-5 py-14 md:px-8 md:py-16">
          <header className="max-w-3xl border-b border-border pb-10">
            {crumbs && crumbs.length > 0 && (
              <nav aria-label="Breadcrumb" className="text-left text-xs text-muted-foreground">
                {crumbs.map((crumb, index) => (
                  <span key={`${crumb.name}-${index}`}>
                    {index > 0 && <span aria-hidden> / </span>}
                    {crumb.href && index < crumbs.length - 1 ? (
                      <Link href={crumb.href} className="hover:text-foreground">{crumb.name}</Link>
                    ) : (
                      <span aria-current={index === crumbs.length - 1 ? "page" : undefined} className={index === crumbs.length - 1 ? "text-foreground" : undefined}>{crumb.name}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            {eyebrow && <p className={`${isPath ? "eyebrow-path" : "eyebrow"} ${crumbs?.length ? "mt-8" : ""}`}>{eyebrow}</p>}
            <MaskLines as="h1" className="display-serif mt-5 text-4xl md:text-5xl" lines={[title]} />
            <p className="mt-6 text-base leading-8 text-muted-foreground">{intro}</p>
          </header>

          {visual && (
            <div className="mt-10 max-w-3xl">
              <div className="card-surface relative overflow-hidden p-6 md:p-10">{visual}</div>
            </div>
          )}

          <div className="content-sections mt-10 grid gap-x-16 gap-y-12 md:grid-cols-2">
            {children}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export function ContentSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-border pt-6 ${className ?? ""}`}>
      <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
      <div className="mt-4 max-w-2xl space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}
