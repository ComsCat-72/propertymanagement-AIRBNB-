import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { deletePropertyWithImages } from "@/lib/cloudinary.functions";

export const Route = createFileRoute("/_authenticated/admin/listings")({
  component: AdminListings,
});

function AdminListings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("*, agent:profiles!properties_agent_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  useEffect(() => {
    const ch = supabase.channel("admin-listings")
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => qc.invalidateQueries({ queryKey: ["admin-listings"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  const del = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    try {
      await deletePropertyWithImages({ data: { id } });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete listing");
    }
  };
  return (
    <div className="space-y-3">
      {data?.map((l) => (
        <div key={l.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
            {(l.images as string[])[0] && <img src={(l.images as string[])[0]} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-semibold">{l.title}</p>
            <p className="truncate text-sm text-muted-foreground">{l.city} · {formatPrice(l.price, l.property_type as "sale" | "rent")} · by {(l as { agent: { full_name: string } | null }).agent?.full_name || "—"}</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full text-destructive" onClick={() => del(l.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
    </div>
  );
}