import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { rankVerifiedFirst } from "@/lib/plans";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { LANDINGS, getLanding } from "@/lib/seo-landing";

export const Route = createFileRoute("/rwanda/$slug")({
  loader: ({ params }) => {
    const landing = getLanding(params.slug);
    if (!landing) throw notFound();
    return { landing };
  },
  head: ({ params, loaderData }) => {
    const l = loaderData?.landing;
    if (!l) return {};
    const url = `${SITE_URL}/rwanda/${params.slug}`;
    return {
      meta: [
        { title: l.title },
        { name: "description", content: l.description },
        { property: "og:title", content: l.title },
        { property: "og:description", content: l.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: `${SITE_URL}/og-cover.jpg` },
        { name: "twitter:image", content: `${SITE_URL}/og-cover.jpg` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
              { "@type": "ListItem", position: 2, name: "Property guides", item: `${SITE_URL}/rwanda` },
              { "@type": "ListItem", position: 3, name: l.h1, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: LandingPage,
});

function LandingPage() {
  const { landing } = Route.useLoaderData();
  const f = landing.filters;

  const { data, isLoading } = useQuery({
    queryKey: ["landing", landing.slug],
    queryFn: async () => {
      let q = supabase
        .from("properties")
        .select("*, agent:profiles!properties_agent_id_fkey(id, full_name, profile_photo_url, phone, is_verified, verified_expires_at)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(24);
      if (f.type) q = q.eq("property_type", f.type);
      if (f.category) q = q.eq("category", f.category as never);
      if (f.city) q = q.ilike("city", `%${f.city}%`);
      const { data, error } = await q;
      if (error) throw error;
      return rankVerifiedFirst((data ?? []) as unknown as PropertyCardData[]);
    },
  });

  const others = LANDINGS.filter((l) => l.slug !== landing.slug);

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1760px] px-6 py-10 lg:px-10">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="px-1">/</span>
          <Link to="/rwanda" className="hover:text-foreground">Property guides</Link>
          <span className="px-1">/</span>
          <span className="text-foreground">{landing.h1}</span>
        </nav>

        <h1 className="max-w-3xl text-3xl font-bold sm:text-4xl">{landing.h1}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{landing.intro}</p>
        <p className="mt-3 text-sm">
          <Link
            to="/properties"
            search={{
              city: f.city ?? "",
              type: f.type ?? "",
              category: f.category ?? "",
              minPrice: "",
              maxPrice: "",
              bedrooms: "",
              sort: "newest",
            }}
            className="font-semibold text-brand underline-offset-4 hover:underline"
          >
            Refine these results with price and bedroom filters →
          </Link>
        </p>

        {isLoading ? (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-lg font-semibold">No matching listings right now</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New listings are added daily — browse{" "}
              <Link to="/properties" search={{ city: "", type: "", category: "", minPrice: "", maxPrice: "", bedrooms: "", sort: "newest" }} className="underline">
                all properties
              </Link>{" "}
              in the meantime.
            </p>
          </div>
        )}

        <section className="mt-16 border-t border-border pt-8">
          <h2 className="text-xl font-bold">Keep looking</h2>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {others.map((l) => (
              <li key={l.slug}>
                <Link to="/rwanda/$slug" params={{ slug: l.slug }} className="text-muted-foreground hover:text-foreground">
                  {l.h1}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/agents" search={{ q: "", city: "", agency: "" }} className="text-muted-foreground hover:text-foreground">
                Find a property agent in Rwanda
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </SiteShell>
  );
}
