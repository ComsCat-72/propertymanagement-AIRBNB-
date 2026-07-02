import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { CategoryPills, type CategoryId } from "@/components/CategoryPills";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import heroHouse from "@/assets/hero-house.png.asset.json";

function HeroSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-1 flex-col justify-center px-4 py-2">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="-ml-0.5 mt-0.5 w-full cursor-pointer appearance-none bg-transparent text-sm font-semibold text-foreground outline-none"
      >
        {options.map((o) => <option key={o} value={o === "Any" ? "" : o}>{o}</option>)}
      </select>
    </div>
  );
}

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
  const [location, setLocation] = useState("USA");
  const [city, setCity] = useState("");
  const [priceRange, setPriceRange] = useState("");

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

  const search = () => {
    const maxPrice = priceRange ? priceRange.split("-").pop()?.replace(/\D/g, "") ?? "" : "";
    navigate({
      to: "/properties",
      search: { city, type: "", maxPrice } as never,
    });
  };

  return (
    <SiteShell>
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-8 px-6 pb-32 pt-12 md:pb-40 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:px-10 lg:pt-20">
          <div className="relative z-10">
            <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Gateway to<br />
              <span className="font-extrabold">Dream Homes</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Discover a curated collection of dream homes at your fingertips, simplified and personalized.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button onClick={search} className="h-12 rounded-full bg-foreground px-7 text-sm font-semibold text-background hover:bg-foreground/90">
                Discover Now
              </Button>
              <button type="button" className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background shadow-sm">
                  <Play className="h-4 w-4 fill-foreground text-foreground" />
                </span>
                Watch Demo
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center lg:justify-end">
            <img
              src={heroHouse.url}
              alt="Modern two-story home"
              className="h-auto w-full max-w-[620px] object-contain"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-6 pb-6 lg:px-10">
          <div className="pointer-events-auto flex w-full max-w-[1180px] items-stretch gap-1 rounded-2xl border border-border bg-background p-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)]">
            <HeroSelect label="⌖ Location" value={location} onChange={setLocation} options={["USA", "Canada", "UK", "UAE"]} />
            <div className="w-px self-stretch bg-border" />
            <HeroSelect label="⌂ Property Type" value={city} onChange={setCity} options={["Any", "House", "Apartment", "Villa", "Land", "Commercial"]} />
            <div className="w-px self-stretch bg-border" />
            <HeroSelect label="$ Price Range" value={priceRange} onChange={setPriceRange} options={["Any", "$ 0 - 2k", "$ 2k - 8k", "$ 8k - 20k", "$ 20k+"]} />
            <Button onClick={search} aria-label="Search" className="grid h-auto w-14 shrink-0 place-items-center rounded-xl bg-foreground text-background hover:bg-foreground/90">
              <Search className="h-5 w-5" />
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
