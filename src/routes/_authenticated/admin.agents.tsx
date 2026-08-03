import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { effectivePlan, isVerified } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/admin/agents")({
  component: AdminAgents,
});

function AdminAgents() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-agents"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("status", { ascending: true }).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  useEffect(() => {
    const ch = supabase.channel("admin-agents")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => qc.invalidateQueries({ queryKey: ["admin-agents"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  const setStatus = async (id: string, status: "active" | "suspended") => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "active" ? "Agent approved" : "Agent suspended");
    qc.invalidateQueries({ queryKey: ["admin-agents"] });
  };
  const setPlan = async (id: string, plan: "free" | "tier1" | "tier2") => {
    const { error } = await supabase.rpc("admin_set_plan", { _agent_id: id, _plan: plan, _days: 30 });
    if (error) { toast.error(error.message); return; }
    toast.success("Plan updated");
    qc.invalidateQueries({ queryKey: ["admin-agents"] });
  };
  const setVerified = async (id: string, verified: boolean) => {
    const { error } = await supabase.rpc("admin_set_verified", { _agent_id: id, _verified: verified, _days: 30 });
    if (error) { toast.error(error.message); return; }
    toast.success(verified ? "Verified badge granted" : "Verified badge removed");
    qc.invalidateQueries({ queryKey: ["admin-agents"] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete this agent and all their data?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-agents"] });
  };
  return (
    <div className="space-y-3">
      {data?.map((a) => (
        <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
          {a.profile_photo_url ? (
            <img src={a.profile_photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand font-bold text-brand-foreground">{a.full_name.charAt(0) || "?"}</span>
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate font-semibold">{a.full_name || "—"}</p>
            <p className="truncate text-sm text-muted-foreground">{a.email} · {a.agency_name || "No agency"}</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.status === "active" ? "bg-brand/10 text-brand" : "bg-destructive/10 text-destructive"}`}>{a.status}</span>
          {a.status === "active" ? (
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setStatus(a.id, "suspended")}>Suspend</Button>
          ) : (
            <Button size="sm" className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => setStatus(a.id, "active")}>Approve</Button>
          )}
          <Button variant="outline" size="sm" className="rounded-full text-destructive" onClick={() => del(a.id)}>Delete</Button>
          <div className="flex w-full flex-wrap items-center gap-3 border-t border-border pt-3 text-xs">
            <span className="text-muted-foreground">Plan</span>
            <select
              className="h-8 rounded-full border border-input bg-background px-3 text-xs capitalize"
              value={effectivePlan(a)}
              onChange={(e) => setPlan(a.id, e.target.value as "free" | "tier1" | "tier2")}
            >
              <option value="free">Free</option>
              <option value="tier1">Tier 1</option>
              <option value="tier2">Tier 2</option>
            </select>
            {a.plan_expires_at && effectivePlan(a) !== "free" && (
              <span className="text-muted-foreground">expires {new Date(a.plan_expires_at).toLocaleDateString()}</span>
            )}
            {isVerified(a) ? (
              <>
                <VerifiedBadge size="sm" />
                <Button variant="outline" size="sm" className="h-7 rounded-full text-xs" onClick={() => setVerified(a.id, false)}>Remove badge</Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="h-7 rounded-full text-xs" onClick={() => setVerified(a.id, true)}>Grant verified badge</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}