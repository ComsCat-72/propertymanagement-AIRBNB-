import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: agents }, { count: properties }, { count: suspended }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("properties").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "suspended"),
      ]);
      return { agents: agents ?? 0, properties: properties ?? 0, suspended: suspended ?? 0 };
    },
  });
  const stats = [
    { label: "Total agents", value: data?.agents ?? 0 },
    { label: "Total listings", value: data?.properties ?? 0 },
    { label: "Suspended agents", value: data?.suspended ?? 0 },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
          <p className="mt-2 text-3xl font-bold">{s.value}</p>
        </div>
      ))}
    </div>
  );
}