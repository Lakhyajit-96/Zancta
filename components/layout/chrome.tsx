import { Navigation, Footer } from "@/components/marketing/nav";

export function LayoutChrome({ children, showNav = true, showFooter = true }: { 
  children: React.ReactNode; 
  showNav?: boolean;
  showFooter?: boolean;
}) {
  return (
    <>
      {showNav && <Navigation />}
      <div className="min-h-screen">{children}</div>
      {showFooter && <Footer />}
    </>
  );
}
