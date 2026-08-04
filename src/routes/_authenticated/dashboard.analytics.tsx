import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { hasAnalytics, planStatus } from "@/lib/plans";
import { EVENT_LABELS, type MonetizationEvent } from "@/lib/events";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  component: AnalyticsPage,
});

const COLORS = ["#1A5C38", "#C9A84C", "#2f8a57", "#e0c476", "#5aa87c", "#8a6f22", "#a0c8b0"];

function AnalyticsPage() {
  const { user, profile } = useAuth();
  const unlocked = hasAnalytics(profile);
  const status = planStatus(profile);

  const { data } = useQuery({
    queryKey: ["agent-analytics", user?.id],
    enabled: !!user && unlocked,
    queryFn: async () => {
      const since = new Date(Date.now() - 29 * 86400000).toISOString();
      const [{ data: props }, { data: views }, { data: events }] = await Promise.all([
        supabase.from("properties").select("id, title, status, category, city, price").eq("agent_id", user!.id),
        supabase.from("listing_views").select("property_id, viewed_at").eq("agent_id", user!.id).gte("viewed_at", since),
        supabase.from("monetization_events").select("*").eq("agent_id", user!.id).gte("created_at", since).order("created_at", { ascending: false }),
      ]);
      return { props: props ?? [], views: views ?? [], events: (events ?? []) as unknown as MonetizationEvent[] };
    },
  });

  if (!unlocked) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-12 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted"><Lock className="h-5 w-5" /></span>
        <p className="mt-4 text-lg font-bold">
          {status === "grace" ? "Analytics is paused" : status === "expired" ? "Analytics is locked" : "Analytics is a paid feature"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {status === "grace"
            ? "Your plan lapsed. You keep your listing allowance during the grace period, but advanced features resume once you renew."
            : "Upgrade to Tier 1 or Tier 2 to see views per listing, trends, category breakdowns and monetization events."}
        </p>
        <Link to="/dashboard/billing">
          <Button className="mt-5 rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
            {status === "grace" ? "Renew plan" : "See plans"}
          </Button>
        </Link>
      </div>
    );
  }

  const props = data?.props ?? [];
  const views = data?.views ?? [];
  const events = data?.events ?? [];

  const eventTypes = ["listing_created", "tier_upgrade", "badge_activated", "quota_reached"] as const;

  const eventsByDay = (() => {
    const map = new Map<string, Record<string, number>>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      map.set(d.toISOString().slice(5, 10), Object.fromEntries(eventTypes.map((t) => [t, 0])));
    }
    for (const e of events) {
      const k = new Date(e.created_at).toISOString().slice(5, 10);
      const row = map.get(k);
      if (row && row[e.event_type] !== undefined) row[e.event_type] += 1;
    }
    return Array.from(map, ([day, counts]) => ({ day, ...counts }));
  })();

  const eventTotals = eventTypes.map((t) => ({
    name: EVENT_LABELS[t] ?? t,
    value: events.filter((e) => e.event_type === t).length,
  }));

  const byDay = (() => {
    const map = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      map.set(d.toISOString().slice(5, 10), 0);
    }
    for (const v of views) {
      const k = new Date(v.viewed_at as string).toISOString().slice(5, 10);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map, ([day, count]) => ({ day, count }));
  })();

  const perListing = props
    .map((p) => ({ name: (p.title as string).slice(0, 18), views: views.filter((v) => v.property_id === p.id).length }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const byCategory = Object.entries(
    props.reduce<Record<string, number>>((acc, p) => { acc[p.category as string] = (acc[p.category as string] ?? 0) + 1; return acc; }, {}),
  ).map(([name, value]) => ({ name, value }));

  const byCity = Object.entries(
    props.reduce<Record<string, number>>((acc, p) => { const c = (p.city as string) || "—"; acc[c] = (acc[c] ?? 0) + 1; return acc; }, {}),
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const stats = [
    { label: "Views (30 days)", value: views.length },
    { label: "Listings", value: props.length },
    { label: "Active", value: props.filter((p) => p.status === "active").length },
    { label: "Avg views / listing", value: props.length ? Math.round((views.length / props.length) * 10) / 10 : 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Views over the last 30 days</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1A5C38" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Top listings by views</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perListing} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="views" fill="#C9A84C" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Listings by category</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Listings by city</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCity}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#1A5C38" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Monetization events (30 days)</h2>
          <p className="text-sm text-muted-foreground">Listings created, upgrades, badge activations and quota limits hit.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventsByDay}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {eventTypes.map((t, i) => (
                  <Bar key={t} dataKey={t} name={EVENT_LABELS[t] ?? t} stackId="e" fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Event mix</h2>
          <p className="text-sm text-muted-foreground">Share of each monetization event over the same period.</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={eventTotals.filter((e) => e.value > 0)} dataKey="value" nameKey="name" outerRadius={80} label>
                  {eventTotals.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">Recent account updates</h2>
        <div className="mt-4 space-y-2">
          {events.slice(0, 12).map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3 text-sm">
              <span className="font-semibold">{EVENT_LABELS[e.event_type] ?? e.event_type}</span>
              {e.plan && <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{e.plan}</span>}
              {e.amount_rwf > 0 && <span className="text-muted-foreground">RWF {e.amount_rwf.toLocaleString()}</span>}
              <span className="ml-auto text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-muted-foreground">No monetization events in the last 30 days.</p>}
        </div>
      </div>
    </div>
  );
}
