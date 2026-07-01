import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, MapPin, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/agents/")({
  head: () => ({ meta: [{ title: "Our agents — LoyalityReal250" }] }),
  component: AgentsPage,
});

function AgentsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [agency, setAgency] = useState("");

  const { data } = useQuery({
    queryKey: ["agents-directory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, agency_name, profile_photo_url, bio, address")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      return data ?? [];
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

  const cities = useMemo(
    () => Array.from(new Set((data ?? []).map((a) => a.address).filter(Boolean))) as string[],
    [data],
  );
  const agencies = useMemo(
    () => Array.from(new Set((data ?? []).map((a) => a.agency_name).filter(Boolean))) as string[],
    [data],
  );

  const filtered = (data ?? []).filter((a) => {
    const needle = q.trim().toLowerCase();
    if (needle && !`${a.full_name} ${a.agency_name ?? ""} ${a.bio ?? ""}`.toLowerCase().includes(needle)) return false;
    if (city && a.address !== city) return false;
    if (agency && a.agency_name !== agency) return false;
    return true;
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-10">
        <h1 className="text-3xl font-bold">Meet our agents</h1>
        <p className="mt-1 text-muted-foreground">Local experts ready to help you find the right property.</p>

        <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, agency or bio" className="rounded-full pl-9" />
          </div>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="h-9 rounded-full border border-input bg-background px-3 text-sm">
            <option value="">Any city</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={agency} onChange={(e) => setAgency(e.target.value)} className="h-9 rounded-full border border-input bg-background px-3 text-sm">
            <option value="">Any agency</option>
            {agencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">{filtered.length} agent{filtered.length === 1 ? "" : "s"}</p>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <Link key={a.id} to="/agents/$id" params={{ id: a.id }} className="rounded-3xl border border-border bg-card p-6 transition hover:shadow-lg">
              <div className="flex items-center gap-4">
                {a.profile_photo_url ? (
                  <img src={a.profile_photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-xl font-bold text-brand-foreground">{a.full_name.charAt(0) || "A"}</span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold">{a.full_name}</p>
                  {a.agency_name && <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><Building2 className="h-3 w-3" /> {a.agency_name}</p>}
                  {a.address && <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {a.address}</p>}
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
      </div>
    </SiteShell>
  );
}