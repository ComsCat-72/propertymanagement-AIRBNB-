import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { CategoryPills, type CategoryId } from "@/components/CategoryPills";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
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
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [category, setCategory] = useState<CategoryId>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "home", category],
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select("*, agent:profiles!properties_agent_id_fkey(id, full_name, profile_photo_url)")
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
        .select("*, agent:profiles!properties_agent_id_fkey(id, full_name, profile_photo_url)")
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

  const explore = () => navigate({ to: "/properties", search: {} as never });

  return (
    <SiteShell>
      <section className="relative isolate overflow-hidden bg-[#05060f] text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(96,80,220,0.45),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[45%] bg-[radial-gradient(ellipse_at_left,rgba(40,80,220,0.35),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[45%] bg-[radial-gradient(ellipse_at_right,rgba(40,80,220,0.35),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:28px_28px]" />

        <div className="relative mx-auto flex max-w-[1280px] flex-col items-center px-6 pb-24 pt-20 text-center lg:pt-28">
          <button
            onClick={explore}
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-5 text-xs font-medium text-white/80 backdrop-blur transition hover:bg-white/[0.08]"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.7)]">
              Book a tour <ArrowRight className="h-3 w-3" />
            </span>
            Free consultation call
          </button>

          <h1 className="mt-8 max-w-4xl font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Gateway to <br />
            <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">Dream Homes</span>
          </h1>
          <p className="mt-6 max-w-lg text-base text-white/60">
            Curated properties for sale and rent — modern, verified, and personalized to you.
          </p>

          <Button
            onClick={explore}
            className="mt-10 h-12 rounded-full bg-blue-600 px-8 text-sm font-semibold text-white shadow-[0_20px_50px_-15px_rgba(37,99,235,0.8)] hover:bg-blue-500"
          >
            Explore Homes
          </Button>

          <div className="mt-10 flex flex-col items-center gap-1.5">
            <div className="flex gap-1 text-yellow-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-sm text-white/70">4.9/5 From 3,602 Customers</p>
          </div>

          <div className="mt-10 grid w-full max-w-3xl grid-cols-3 gap-2 sm:grid-cols-6">
            {["Kigali", "Nairobi", "Lagos", "Dubai", "London", "New York"].map((c) => (
              <span
                key={c}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-center text-xs font-medium text-white/70 backdrop-blur"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

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
