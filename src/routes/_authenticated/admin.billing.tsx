import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRwf } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin/billing")({
  component: AdminBilling,
});

function AdminBilling() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["admin-upgrade-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("upgrade_requests")
        .select("*, agent:profiles!upgrade_requests_agent_id_fkey(id, full_name, email, agency_name, plan, plan_expires_at, is_verified)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("admin-billing")
      .on("postgres_changes", { event: "*", schema: "public", table: "upgrade_requests" }, () => qc.invalidateQueries({ queryKey: ["admin-upgrade-requests"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const approve = async (id: string) => {
    const { error } = await supabase.rpc("approve_upgrade_request", { _request_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Upgrade approved — plan active for 30 days");
    qc.invalidateQueries({ queryKey: ["admin-upgrade-requests"] });
    qc.invalidateQueries({ queryKey: ["admin-agents"] });
  };

  const reject = async (id: string) => {
    const { error } = await supabase.rpc("reject_upgrade_request", { _request_id: id, _note: notes[id] ?? "" });
    if (error) { toast.error(error.message); return; }
    toast.success("Request rejected");
    qc.invalidateQueries({ queryKey: ["admin-upgrade-requests"] });
  };

  const rows = data ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  const reviewed = rows.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold">Pending requests ({pending.length})</h2>
        <div className="mt-3 space-y-3">
          {pending.map((r) => {
            const agent = r.agent as unknown as { full_name: string; email: string; agency_name: string | null } | null;
            return (
              <div key={r.id} className="rounded-2xl border border-gold/40 bg-gold/5 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{agent?.full_name || "—"}</p>
                    <p className="truncate text-sm text-muted-foreground">{agent?.email} · {agent?.agency_name || "No agency"}</p>
                  </div>
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold capitalize text-brand">
                    {r.requested_plan}{r.wants_badge ? " + badge" : ""}
                  </span>
                  <span className="font-semibold">{formatRwf(r.amount_rwf)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                {r.payment_reference && <p className="mt-2 text-sm">Reference: <span className="font-mono">{r.payment_reference}</span></p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Input
                    placeholder="Note (used when rejecting)"
                    className="h-9 max-w-xs rounded-full"
                    value={notes[r.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                  />
                  <Button size="sm" className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => approve(r.id)}>Approve</Button>
                  <Button size="sm" variant="outline" className="rounded-full text-destructive" onClick={() => reject(r.id)}>Reject</Button>
                </div>
              </div>
            );
          })}
          {pending.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No pending upgrade requests.</div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Reviewed</h2>
        <div className="mt-3 space-y-2">
          {reviewed.map((r) => {
            const agent = r.agent as unknown as { full_name: string } | null;
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
                <span className="font-semibold">{agent?.full_name || "—"}</span>
                <span className="capitalize text-muted-foreground">{r.requested_plan}{r.wants_badge ? " + badge" : ""}</span>
                <span className="text-muted-foreground">{formatRwf(r.amount_rwf)}</span>
                <span className="text-xs text-muted-foreground">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : ""}</span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "approved" ? "bg-brand/10 text-brand" : "bg-destructive/10 text-destructive"}`}>{r.status}</span>
                {r.admin_note && <span className="w-full text-xs text-muted-foreground">Note: {r.admin_note}</span>}
              </div>
            );
          })}
          {reviewed.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nothing reviewed yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
