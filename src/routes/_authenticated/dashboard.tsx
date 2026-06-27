import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { pathname } = useLocation();
  const tabs = [
    { to: "/dashboard", label: "Overview" },
    { to: "/dashboard/listings", label: "My Listings" },
    { to: "/dashboard/profile", label: "Profile" },
  ] as const;
  return (
    <SiteShell>
      <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-10">
        <h1 className="text-3xl font-bold">Agent dashboard</h1>
        <div className="mt-6 flex gap-2 border-b border-border">
          {tabs.map((t) => (
            <Link key={t.to} to={t.to} className={`rounded-t-xl px-4 py-2 text-sm font-semibold ${pathname === t.to ? "border-b-2 border-brand text-brand" : "text-muted-foreground hover:text-foreground"}`}>{t.label}</Link>
          ))}
        </div>
        <div className="mt-8"><Outlet /></div>
      </div>
    </SiteShell>
  );
}