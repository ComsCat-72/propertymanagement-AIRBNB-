import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { rankVerifiedFirst } from "@/lib/plans";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchParams {
  city?: string;
  type?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  sort?: string;
}

export const Route = createFileRoute("/properties/")({
  head: () => ({
    meta: [
      { title: "All Properties for Sale & Rent | LoyalityReal250" },
      { name: "description", content: "Search every LoyalityReal250 listing — houses, apartments, land, commercial property and vehicles — filtered by city, price, type and bedrooms." },
      { property: "og:title", content: "All Properties for Sale & Rent | LoyalityReal250" },
      { property: "og:description", content: "Search every LoyalityReal250 listing by city, price, type and bedrooms." },
      { property: "og:url", content: "https://dwell-discover-dot.lovable.app/properties" },
    ],
    links: [{ rel: "canonical", href: "https://dwell-discover-dot.lovable.app/properties" }],
  }),
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    city: (s.city as string) || "",
    type: (s.type as string) || "",
    category: (s.category as string) || "",
    minPrice: (s.minPrice as string) || "",
    maxPrice: (s.maxPrice as string) || "",
    bedrooms: (s.bedrooms as string) || "",
    sort: (s.sort as string) || "newest",
  }),
  component: PropertiesPage,
});

const PAGE_SIZE = 12;

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const sort = search.sort || "newest";

  // Local draft state for the filter form; committed to URL on Apply.
  const [city, setCity] = useState(search.city || "");
  const [type, setType] = useState(search.type || "");
  const [category, setCategory] = useState(search.category || "");
  const [minPrice, setMinPrice] = useState(search.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(search.maxPrice || "");
  const [bedrooms, setBedrooms] = useState(search.bedrooms || "");

  // Keep draft synced when URL changes (e.g. shared link, browser back).
  useEffect(() => {
    setCity(search.city || "");
    setType(search.type || "");
    setCategory(search.category || "");
    setMinPrice(search.minPrice || "");
    setMaxPrice(search.maxPrice || "");
    setBedrooms(search.bedrooms || "");
  }, [search.city, search.type, search.category, search.minPrice, search.maxPrice, search.bedrooms]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["properties-list", search],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam as number;
      let q = supabase
        .from("properties")
        .select("*, agent:profiles!properties_agent_id_fkey(id, full_name, profile_photo_url, phone, is_verified, verified_expires_at)", { count: "exact" })
        .eq("status", "active");
      if (search.city) q = q.ilike("city", `%${search.city}%`);
      if (search.type) q = q.eq("property_type", search.type as "sale" | "rent");
      if (search.category) q = q.eq("category", search.category as never);
      if (search.minPrice) q = q.gte("price", parseFloat(search.minPrice));
      if (search.maxPrice) q = q.lte("price", parseFloat(search.maxPrice));
      if (search.bedrooms) q = q.gte("bedrooms", parseInt(search.bedrooms, 10));
      if (sort === "price_asc") q = q.order("price", { ascending: true });
      else if (sort === "price_desc") q = q.order("price", { ascending: false });
      else q = q.order("created_at", { ascending: false });
      q = q.range(from, from + PAGE_SIZE - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as unknown as PropertyCardData[];
      return {
        rows: rankVerifiedFirst(rows),
        count: count ?? 0,
        nextFrom: rows.length === PAGE_SIZE ? from + PAGE_SIZE : null,
      };
    },
    getNextPageParam: (last) => last.nextFrom,
  });

  const rows = (data?.pages ?? []).flatMap((p) => p.rows);
  const total = data?.pages[0]?.count ?? 0;

  const apply = () => {
    navigate({ search: { city, type, category, minPrice, maxPrice, bedrooms, sort } });
  };
  const reset = () => {
    navigate({ search: { sort: "newest" } });
  };

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1760px] px-6 py-8 lg:px-10">
        <h1 className="mb-6 text-3xl font-bold">Browse properties</h1>

        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-8">
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="rounded-full" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 rounded-full border border-input bg-background px-3 text-sm">
            <option value="">Any type</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-full border border-input bg-background px-3 text-sm">
            <option value="">Any category</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="land">Land</option>
            <option value="commercial">Commercial</option>
            <option value="villa">Villa</option>
            <option value="car">Car</option>
            <option value="motorcycle">Motorcycle</option>
          </select>
          <Input placeholder="Min $" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="rounded-full" />
          <Input placeholder="Max $" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="rounded-full" />
          <Input placeholder="Bedrooms" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="rounded-full" />
          <Button onClick={apply} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">Apply</Button>
          <Button variant="outline" onClick={reset} className="rounded-full">Reset</Button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{total} results</p>
          <select
            value={sort}
            onChange={(e) => navigate({ search: { ...search, sort: e.target.value } })}
            className="h-9 rounded-full border border-input bg-background px-3 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
          </select>
        </div>

        {isLoading ? (
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : rows.length > 0 ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows.map((p) => <PropertyCard key={p.id} p={p} />)}
            </div>
            <div ref={sentinelRef} className="h-10" />
            {isFetchingNextPage && (
              <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            )}
            {!hasNextPage && (
              <p className="mt-10 text-center text-xs text-muted-foreground">You've reached the end.</p>
            )}
          </>
        ) : (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-lg font-semibold">No properties match your filters</p>
          </div>
        )}
      </div>
    </SiteShell>
  );
}