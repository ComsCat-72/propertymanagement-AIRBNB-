import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CreditCard, Eye, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRwf } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin/activity")({
  component: AdminActivity,
});

interface Item {
  id: string;
  kind: "agent" | "listing" | "request" | "view";
  at: string;
  title: string;
  detail: string;
  to?: { path: "/properties/$id" | "/agents/$id"; id: string };
}

function AdminActivity() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async (): Promise<Item[]> => {
      const [agents, listings, requests, views] = await Promise.all([
        supabase.from("profiles").select("id, full_name, agency_name, status, created_at").order("created_at", { ascending: false }).limit(20),
        supabase.from("properties").select("id, title, city, price, status, created_at").order("created_at", { ascending: false }).limit(20),
        supabase.from("upgrade_requests").select("id, requested_plan, amount_rwf, status, created_at, agent:profiles!upgrade_requests_agent_id_fkey(full_name)").order("created_at", { ascending: false }).limit(20),
        supabase.from("listing_views").select("id, viewed_at, property_id").order("viewed_at", { ascending: false }).limit(20),
      ]);
      const items: Item[] = [];
      for (const a of agents.data ?? []) items.push({ id: `a-${a.id}`, kind: "agent", at: a.created_at as string, title: `New agent: ${a.full_name || "Unnamed"}`, detail: `${a.agency_name || "No agency"} · ${a.status}`, to: { path: "/agents/$id", id: a.id as string } });
      for (const p of listings.data ?? []) items.push({ id: `p-${p.id}`, kind: "listing", at: p.created_at as string, title: `New listing: ${p.title}`, detail: `${p.city} · ${p.status}`, to: { path: "/properties/$id", id: p.id as string } });
      for (const r of requests.data ?? []) items.push({ id: `r-${r.id}`, kind: "request", at: r.created_at as string, title: `Upgrade request: ${(r.agent as unknown as { full_name: string } | null)?.full_name ?? "Agent"}`, detail: `${r.requested_plan} · ${formatRwf(r.amount_rwf as number)} · ${r.status}` });
      for (const v of views.data ?? []) items.push({ id: `v-${v.id}`, kind: "view", at: v.viewed_at as string, title: "Listing viewed", detail: "A visitor opened a property page", to: { path: "/properties/$id", id: v.property_id as string } });
      return items.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime()).slice(0, 60);
    },
  });

  useEffect(() => {
    const ch = supabase.channel("admin-activity-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => qc.invalidateQueries({ queryKey: ["admin-activity"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => qc.invalidateQueries({ queryKey: ["admin-activity"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "upgrade_requests" }, () => qc.invalidateQueries({ queryKey: ["admin-activity"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const icon = (k: Item["kind"]) =>
    k === "agent" ? <UserPlus className="h-4 w-4" /> : k === "listing" ? <Building2 className="h-4 w-4" /> : k === "request" ? <CreditCard className="h-4 w-4" /> : <Eye className="h-4 w-4" />;

  return (
    <div>
      <h2 className="text-xl font-bold">Everything happening on the site</h2>
      <p className="text-sm text-muted-foreground">Live feed of new agents, listings, upgrade requests and property views.</p>
      <div className="mt-5 space-y-2">
        {(data ?? []).map((i) => {
          const body = (
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:shadow-sm">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">{icon(i.kind)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{i.title}</p>
                <p className="truncate text-sm text-muted-foreground">{i.detail}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{new Date(i.at).toLocaleString()}</span>
            </div>
          );
          return i.to ? (
            <Link key={i.id} to={i.to.path} params={{ id: i.to.id }} className="block">{body}</Link>
          ) : (
            <div key={i.id}>{body}</div>
          );
        })}
        {data && data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No activity yet.</div>
        )}
      </div>
    </div>
  );
}
