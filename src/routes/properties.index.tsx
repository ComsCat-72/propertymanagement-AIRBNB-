import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchParams {
  city?: string;
  type?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  sort?: string;
  page?: string;
}

export const Route = createFileRoute("/properties/")({
  head: () => ({ meta: [{ title: "All properties — LoyalityReal250" }] }),
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    city: (s.city as string) || "",
    type: (s.type as string) || "",
    category: (s.category as string) || "",
    minPrice: (s.minPrice as string) || "",
    maxPrice: (s.maxPrice as string) || "",
    bedrooms: (s.bedrooms as string) || "",
    sort: (s.sort as string) || "newest",
    page: (s.page as string) || "1",
  }),
  component: PropertiesPage,
});

const PAGE_SIZE = 12;

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [city, setCity] = useState(search.city || "");
  const [type, setType] = useState(search.type || "");
  const [category, setCategory] = useState(search.category || "");
  const [minPrice, setMinPrice] = useState(search.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(search.maxPrice || "");
  const [bedrooms, setBedrooms] = useState(search.bedrooms || "");
  const sort = search.sort || "newest";
  const page = parseInt(search.page || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["properties-list", search],
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select("*, agent:profiles!properties_agent_id_fkey(id, full_name, profile_photo_url)", { count: "exact" })
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
      const from = (page - 1) * PAGE_SIZE;
      q = q.range(from, from + PAGE_SIZE - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as unknown as PropertyCardData[], count: count ?? 0 };
    },
  });

  const apply = () => {
    navigate({ search: { city, type, category, minPrice, maxPrice, bedrooms, sort, page: "1" } });
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1760px] px-6 py-8 lg:px-10">
        <h1 className="mb-6 text-3xl font-bold">Browse properties</h1>

        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-7">
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
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data?.count ?? 0} results</p>
          <select
            value={sort}
            onChange={(e) => navigate({ search: { ...search, sort: e.target.value, page: "1" } })}
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
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : data && data.rows.length > 0 ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.rows.map((p) => <PropertyCard key={p.id} p={p} />)}
            </div>
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button variant="outline" className="rounded-full" disabled={page <= 1} onClick={() => navigate({ search: { ...search, page: String(page - 1) } })}>Previous</Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" className="rounded-full" disabled={page >= totalPages} onClick={() => navigate({ search: { ...search, page: String(page + 1) } })}>Next</Button>
            </div>
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