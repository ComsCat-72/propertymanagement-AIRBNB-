import { createFileRoute, Link, Outlet, useLocation, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login", search: { next: undefined } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { pathname } = useLocation();
  const tabs = [
    { to: "/admin", label: "Overview" },
    { to: "/admin/agents", label: "Agents" },
    { to: "/admin/listings", label: "Listings" },
    { to: "/admin/billing", label: "Billing" },
    { to: "/admin/activity", label: "Activity" },
  ] as const;
  return (
    <SiteShell>
      <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-10">
        <h1 className="text-3xl font-bold">Admin</h1>
        <div className="mt-6 flex flex-wrap gap-2 border-b border-border">
          {tabs.map((t) => (
            <Link key={t.to} to={t.to} className={`rounded-t-xl px-4 py-2 text-sm font-semibold ${pathname === t.to ? "border-b-2 border-brand text-brand" : "text-muted-foreground hover:text-foreground"}`}>{t.label}</Link>
          ))}
        </div>
        <div className="mt-8"><Outlet /></div>
      </div>
    </SiteShell>
  );
}