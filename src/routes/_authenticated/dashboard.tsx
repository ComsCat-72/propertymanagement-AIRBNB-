import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteShell } from "@/components/SiteShell";
import { useAuth } from "@/lib/auth";
import { GRACE_DAYS, graceEndsAt, planStatus } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const { pathname } = useLocation();
  const { profile, isAgent, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  // Visitors who signed in with Google are clients, not agents — send them to their account area.
  useEffect(() => {
    if (!loading && !isAgent && !isAdmin) navigate({ to: "/account", replace: true });
  }, [loading, isAgent, isAdmin, navigate]);

  const status = planStatus(profile);
  const graceEnd = graceEndsAt(profile);
  const tabs = [
    { to: "/dashboard", label: "Overview" },
    { to: "/dashboard/listings", label: "My Listings" },
    { to: "/dashboard/boosts", label: "Boosts" },
    { to: "/dashboard/leads", label: "Leads" },
    { to: "/dashboard/deals", label: "Deals" },
    { to: "/dashboard/viewings", label: "Viewings" },
    { to: "/dashboard/page", label: "My page" },
    { to: "/dashboard/analytics", label: "Analytics" },
    { to: "/dashboard/billing", label: "Billing" },
    { to: "/dashboard/profile", label: "Profile" },
  ] as const;
  return (
    <SiteShell>
      <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-10">
        <h1 className="text-3xl font-bold">Agent dashboard</h1>
        {profile?.status === "suspended" && (
          <div className="mt-4 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-3 text-sm">
            <strong className="font-semibold">Your account is pending approval.</strong> An admin must approve your account before your listings appear publicly.
          </div>
        )}
        {status === "grace" && (
          <div className="mt-4 rounded-2xl border border-gold/40 bg-gold/10 px-5 py-3 text-sm">
            <strong className="font-semibold">Grace period — {GRACE_DAYS} days.</strong> Your plan lapsed. You keep your listing
            allowance until {graceEnd?.toLocaleDateString()}, but analytics and other advanced features are paused.{" "}
            <Link to="/dashboard/billing" className="font-semibold underline">Renew now</Link>.
          </div>
        )}
        {status === "expired" && (
          <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-3 text-sm">
            <strong className="font-semibold">Your subscription has expired.</strong> Your existing listings stay live, but you're back on the Free limit.{" "}
            <Link to="/dashboard/billing" className="font-semibold underline">Subscribe again</Link> to keep adding listings.
          </div>
        )}
        {profile?.cancel_at_period_end && status !== "free" && status !== "expired" && (
          <div className="mt-4 rounded-2xl border border-border bg-muted px-5 py-3 text-sm">
            <strong className="font-semibold">Cancellation scheduled.</strong> Your plan will not renew
            {profile.plan_expires_at ? ` after ${new Date(profile.plan_expires_at).toLocaleDateString()}` : ""}.{" "}
            <Link to="/dashboard/billing" className="font-semibold underline">Manage billing</Link>.
          </div>
        )}
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