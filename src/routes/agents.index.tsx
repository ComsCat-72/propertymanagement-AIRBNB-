import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { isVerified } from "@/lib/plans";
import { cldUrl } from "@/lib/cloudinary";
import { SITE_URL } from "@/lib/site";

interface AgentsSearch {
  q: string;
  city: string;
  agency: string;
}
const PAGE_SIZE = 12;

export const Route = createFileRoute("/agents/")({
  head: () => ({
    meta: [
      { title: "Find a Real Estate Agent | Ibyungura.com" },
      { name: "description", content: "Browse verified Ibyungura.com property agents, read their profiles and achievements, and contact the right agent for your next home or investment." },
      { property: "og:title", content: "Find a Real Estate Agent | Ibyungura.com" },
      { property: "og:description", content: "Browse verified Ibyungura.com property agents and contact the right one for your next home." },
      { property: "og:url", content: `${SITE_URL}/agents` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/agents` }],
  }),
  validateSearch: (s: Record<string, unknown>): AgentsSearch => ({
    q: (s.q as string) || "",
    city: (s.city as string) || "",
    agency: (s.agency as string) || "",
  }),
  component: AgentsPage,
});

function AgentsPage() {
  const qc = useQueryClient();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { q, city, agency } = search;
  const setSearch = (patch: Partial<AgentsSearch>) =>
    navigate({ search: (prev: AgentsSearch) => ({ ...prev, ...patch }) });

  const { data, isLoading } = useQuery({
    queryKey: ["agents-directory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, agency_name, profile_photo_url, bio, is_verified, verified_expires_at")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      const rows = data ?? [];
      // Verified agents surface first in the directory.
      return rows
        .map((a, i) => ({ a, i, v: isVerified(a) ? 1 : 0 }))
        .sort((x, y) => y.v - x.v || x.i - y.i)
        .map((x) => x.a);
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("agents-directory-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        qc.invalidateQueries({ queryKey: ["agents-directory"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const agencies = useMemo(
    () => Array.from(new Set((data ?? []).map((a) => a.agency_name).filter(Boolean))) as string[],
    [data],
  );

  const filtered = useMemo(() => (data ?? []).filter((a) => {
    const needle = q.trim().toLowerCase();
    if (needle && !`${a.full_name} ${a.agency_name ?? ""} ${a.bio ?? ""}`.toLowerCase().includes(needle)) return false;
    if (agency && a.agency_name !== agency) return false;
    return true;
  }), [data, q, city, agency]);

  // Incremental reveal (infinite scroll) over the filtered set.
  const [visible, setVisible] = useState(PAGE_SIZE);
  useEffect(() => { setVisible(PAGE_SIZE); }, [q, city, agency, data]);
  const pageRows = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setVisible((v) => v + PAGE_SIZE);
      }
    }, { rootMargin: "500px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore]);

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-10">
        <h1 className="text-3xl font-bold">Meet our agents</h1>
        <p className="mt-1 text-muted-foreground">Local experts ready to help you find the right property.</p>

        <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search agents by name, agency or bio" value={q} onChange={(e) => setSearch({ q: e.target.value })} placeholder="Search by name, agency or bio" className="rounded-full pl-9" />
          </div>
          <select aria-label="Filter agents by agency" value={agency} onChange={(e) => setSearch({ agency: e.target.value })} className="h-9 rounded-full border border-input bg-background px-3 text-sm">
            <option value="">Any agency</option>
            {agencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">{filtered.length} agent{filtered.length === 1 ? "" : "s"}</p>

        {isLoading ? (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-5/6" />
              </div>
            ))}
          </div>
        ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pageRows.map((a) => (
            <Link key={a.id} to="/agents/$id" params={{ id: a.id }} className="rounded-3xl border border-border bg-card p-6 transition hover:shadow-lg">
              <div className="flex items-center gap-4">
                {a.profile_photo_url ? (
                  <img src={cldUrl(a.profile_photo_url, 200)} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-xl font-bold text-brand-foreground">{a.full_name.charAt(0) || "A"}</span>
                )}
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-bold">
                    {a.full_name}
                    {isVerified(a) && <VerifiedBadge size="sm" withLabel={false} />}
                  </p>
                  {a.agency_name && <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><Building2 className="h-3 w-3" /> {a.agency_name}</p>}
                </div>
              </div>
              {a.bio && <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{a.bio}</p>}
              <span className="mt-4 inline-block text-xs font-semibold text-brand">View profile →</span>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No agents match your filters.
            </div>
          )}
        </div>
        )}

        <div ref={sentinelRef} className="h-10" />
        {!hasMore && filtered.length > PAGE_SIZE && (
          <p className="mt-4 text-center text-xs text-muted-foreground">You've reached the end.</p>
        )}
      </div>
    </SiteShell>
  );
}