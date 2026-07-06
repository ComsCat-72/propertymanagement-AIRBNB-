import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { CategoryPills, type CategoryId } from "@/components/CategoryPills";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LoyalityReal250 — Find your next home" },
      { name: "description", content: "Browse the latest property listings for sale and rent." },
      { property: "og:title", content: "LoyalityReal250" },
      { property: "og:description", content: "Browse the latest property listings for sale and rent." },
    ],
  }),
  component: Index,
});

function Index() {
  const qc = useQueryClient();
  const [category, setCategory] = useState<CategoryId>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "home", category],
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select("*, agent:profiles!properties_agent_id_fkey(id, full_name, profile_photo_url, phone)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);
      if (category !== "all") {
        if (category === "sale" || category === "rent") q = q.eq("property_type", category);
        else q = q.eq("category", category as never);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as PropertyCardData[];
    },
  });

  const { data: featured } = useQuery({
    queryKey: ["properties", "featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("*, agent:profiles!properties_agent_id_fkey(id, full_name, profile_photo_url, phone)")
        .eq("is_featured", true)
        .eq("status", "active")
        .limit(8);
      return (data ?? []) as unknown as PropertyCardData[];
    },
  });

  // Realtime: refresh on any property/profile change
  useEffect(() => {
    const channel = supabase
      .channel("home-properties")
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, () => {
        qc.invalidateQueries({ queryKey: ["properties"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        qc.invalidateQueries({ queryKey: ["properties"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return (
    <SiteShell>
      <CategoryPills active={category} onChange={setCategory} />

      {featured && featured.length > 0 && (
        <section className="mx-auto max-w-[1760px] px-6 pt-10 lg:px-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold">Featured properties</h2>
              <p className="text-sm text-muted-foreground">Handpicked by our team</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1760px] px-6 py-10 lg:px-10">
        <h2 className="mb-5 text-2xl font-bold">Latest listings</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-lg font-semibold">No listings yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Be the first to add one — sign up as an agent.</p>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
