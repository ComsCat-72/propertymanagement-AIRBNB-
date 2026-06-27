import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/agents/")({
  head: () => ({ meta: [{ title: "Our agents — LoyalityReal250" }] }),
  component: AgentsPage,
});

function AgentsPage() {
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

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1280px] px-6 py-10 lg:px-10">
        <h1 className="text-3xl font-bold">Meet our agents</h1>
        <p className="mt-1 text-muted-foreground">Local experts ready to help you find the right property.</p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((a) => (
            <Link key={a.id} to="/agents/$id" params={{ id: a.id }} className="rounded-3xl border border-border bg-card p-6 transition hover:shadow-lg">
              <div className="flex items-center gap-4">
                {a.profile_photo_url ? (
                  <img src={a.profile_photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-xl font-bold text-brand-foreground">{a.full_name.charAt(0) || "A"}</span>
                )}
                <div>
                  <p className="font-bold">{a.full_name}</p>
                  {a.agency_name && <p className="text-xs text-muted-foreground">{a.agency_name}</p>}
                </div>
              </div>
              {a.bio && <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{a.bio}</p>}
            </Link>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}