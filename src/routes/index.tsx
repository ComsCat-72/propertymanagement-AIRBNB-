import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { CategoryPills, type CategoryId } from "@/components/CategoryPills";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [category, setCategory] = useState<CategoryId>("all");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

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
        else q = q.eq("category", category);
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

  const search = () => {
    navigate({
      to: "/properties",
      search: { city, type, maxPrice } as never,
    });
  };

  return (
    <SiteShell>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-brand to-brand/70 text-brand-foreground">
        <div className="mx-auto max-w-[1760px] px-6 py-16 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-3 inline-block rounded-full bg-gold/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-foreground">Loyality Real 250</p>
            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">Find a place where you belong.</h1>
            <p className="mt-4 text-lg opacity-90">Discover handpicked homes, apartments, land, and commercial spaces — for sale or rent.</p>
          </div>

          <div className="mt-10 rounded-3xl border border-white/20 bg-background p-3 text-foreground shadow-2xl md:flex md:items-center md:gap-2 md:rounded-full md:p-2">
            <div className="flex-1 px-4 py-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider">Location</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City or area" className="h-7 border-0 p-0 text-sm shadow-none focus-visible:ring-0" />
            </div>
            <div className="hidden h-10 w-px bg-border md:block" />
            <div className="flex-1 px-4 py-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-transparent text-sm font-medium outline-none">
                <option value="">Any</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>
            <div className="hidden h-10 w-px bg-border md:block" />
            <div className="flex-1 px-4 py-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider">Max price</label>
              <Input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Any" className="h-7 border-0 p-0 text-sm shadow-none focus-visible:ring-0" />
            </div>
            <Button onClick={search} className="mt-3 h-12 w-full rounded-full bg-brand font-semibold text-brand-foreground hover:bg-brand/90 md:mt-0 md:w-auto md:px-6">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
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
                <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
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
