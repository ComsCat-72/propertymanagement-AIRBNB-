import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRwf } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin/growth")({
  component: AdminGrowth,
});

function AdminGrowth() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  const boosts = useQuery({
    queryKey: ["admin-boosts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("listing_boosts")
        .select("*, agent:profiles!listing_boosts_agent_id_fkey(full_name), property:properties(title, city)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const purchases = useQuery({
    queryKey: ["admin-lead-purchases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lead_purchases")
        .select("*, agent:profiles!lead_purchases_agent_id_fkey(full_name), lead:buyer_leads(summary, city, score)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string, keys: string[]) => {
    const { error } = await fn();
    if (error) { toast.error(error.message); return; }
    toast.success(ok);
    keys.forEach((k) => void qc.invalidateQueries({ queryKey: [k] }));
  };

  const generate = async () => {
    setGenerating(true);
    const { data, error } = await supabase.rpc("generate_buyer_leads");
    setGenerating(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${data ?? 0} buyer lead(s) refreshed`);
  };

  const pendingBoosts = (boosts.data ?? []).filter((b) => b.status === "pending");
  const pendingLeads = (purchases.data ?? []).filter((p) => p.status === "pending");

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-bold">Pending boost payments ({pendingBoosts.length})</h2>
        <div className="mt-3 space-y-3">
          {pendingBoosts.map((b) => {
            const agent = b.agent as unknown as { full_name: string } | null;
            const prop = b.property as unknown as { title: string; city: string } | null;
            return (
              <div key={b.id} className="rounded-2xl border border-gold/40 bg-gold/5 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold">{agent?.full_name ?? "—"}</span>
                  <span className="text-muted-foreground">{prop?.title ?? "Listing"} · {prop?.city}</span>
                  <span className="font-semibold">{b.days} days · {formatRwf(b.amount_rwf)}</span>
                  {b.payment_reference && <span className="font-mono text-xs">{b.payment_reference}</span>}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Input placeholder="Note (used when rejecting)" className="h-9 max-w-xs rounded-full" value={notes[b.id] ?? ""} onChange={(e) => setNotes({ ...notes, [b.id]: e.target.value })} />
                  <Button size="sm" className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
                    onClick={() => void run(() => supabase.rpc("approve_listing_boost", { _boost_id: b.id }), "Boost activated", ["admin-boosts"])}>Approve</Button>
                  <Button size="sm" variant="outline" className="rounded-full text-destructive"
                    onClick={() => void run(() => supabase.rpc("reject_listing_boost", { _boost_id: b.id, _note: notes[b.id] ?? "" }), "Boost rejected", ["admin-boosts"])}>Reject</Button>
                </div>
              </div>
            );
          })}
          {pendingBoosts.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No boost requests waiting.</p>}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Pending lead purchases ({pendingLeads.length})</h2>
          <Button variant="outline" className="rounded-full" disabled={generating} onClick={() => void generate()}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${generating ? "animate-spin" : ""}`} /> Refresh buyer leads
          </Button>
        </div>
        <div className="mt-3 space-y-3">
          {pendingLeads.map((p) => {
            const agent = p.agent as unknown as { full_name: string } | null;
            const lead = p.lead as unknown as { summary: string; city: string; score: number } | null;
            return (
              <div key={p.id} className="rounded-2xl border border-gold/40 bg-gold/5 p-4 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold">{agent?.full_name ?? "—"}</span>
                  <span className="text-muted-foreground">{lead?.summary ?? "Lead"}</span>
                  <span className="font-semibold">{formatRwf(p.amount_rwf)}</span>
                  {p.payment_reference && <span className="font-mono text-xs">{p.payment_reference}</span>}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Input placeholder="Note (used when rejecting)" className="h-9 max-w-xs rounded-full" value={notes[p.id] ?? ""} onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })} />
                  <Button size="sm" className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
                    onClick={() => void run(() => supabase.rpc("approve_lead_purchase", { _purchase_id: p.id }), "Lead unlocked for the agent", ["admin-lead-purchases"])}>Approve</Button>
                  <Button size="sm" variant="outline" className="rounded-full text-destructive"
                    onClick={() => void run(() => supabase.rpc("reject_lead_purchase", { _purchase_id: p.id, _note: notes[p.id] ?? "" }), "Purchase rejected", ["admin-lead-purchases"])}>Reject</Button>
                </div>
              </div>
            );
          })}
          {pendingLeads.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No lead purchases waiting.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Recent activity</h2>
        <div className="mt-3 space-y-2">
          {[...(boosts.data ?? []).filter((b) => b.status !== "pending").map((b) => ({
            id: `b-${b.id}`, when: b.reviewed_at ?? b.created_at, label: `Boost · ${b.days} days`, amount: b.amount_rwf, status: b.status,
          })), ...(purchases.data ?? []).filter((p) => p.status !== "pending").map((p) => ({
            id: `l-${p.id}`, when: p.reviewed_at ?? p.created_at, label: "Lead purchase", amount: p.amount_rwf, status: p.status,
          }))]
            .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
            .slice(0, 25)
            .map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
                <span className="font-semibold">{r.label}</span>
                <span className="text-muted-foreground">{formatRwf(r.amount)}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.when).toLocaleString()}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "approved" ? "bg-brand/10 text-brand" : "bg-destructive/10 text-destructive"}`}>{r.status}</span>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
