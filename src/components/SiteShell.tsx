import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CookieBanner } from "./CookieBanner";
import { MobileBottomNav } from "./MobileBottomNav";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans pb-16 lg:pb-0">
      <Navbar />
      <main className="flex-1">{children}</main>
      <div className="hidden lg:block">
        <Footer />
      </div>
      <CookieBanner />
      <MobileBottomNav />
    </div>
  );
}