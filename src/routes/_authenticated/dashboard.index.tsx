import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { user, profile } = useAuth();
  const { data } = useQuery({
    queryKey: ["agent-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, count } = await supabase
        .from("properties")
        .select("status, is_featured", { count: "exact" })
        .eq("agent_id", user!.id);
      const rows = data ?? [];
      return {
        total: count ?? 0,
        active: rows.filter((r) => r.status === "active").length,
        sold: rows.filter((r) => r.status === "sold").length,
        featured: rows.filter((r) => r.is_featured).length,
      };
    },
  });
  const stats = [
    { label: "Total listings", value: data?.total ?? 0 },
    { label: "Active", value: data?.active ?? 0 },
    { label: "Sold / Rented", value: data?.sold ?? 0 },
    { label: "Featured", value: data?.featured ?? 0 },
  ];
  return (
    <div>
      <p className="mb-6 text-muted-foreground">Welcome back, <span className="font-semibold text-foreground">{profile?.full_name || "Agent"}</span>.</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}