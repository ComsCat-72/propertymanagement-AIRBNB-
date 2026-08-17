import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Star, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/SiteShell";
import { useAuth } from "@/lib/auth";
import { PropertyCard, type PropertyCardData } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/StarRating";
import { reviewScore } from "@/components/AgentReviews";
import { cldUrl } from "@/lib/cloudinary";
import { DEFAULT_DIAL, joinPhone, splitPhone } from "@/lib/phone";
import { PhoneField } from "@/components/PhoneField";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [{ title: "My account | Ibyungura.com" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AccountPage,
});

const PROPERTY_SELECT =
  "id, title, city, location, price, property_type, category, bedrooms, bathrooms, area_sqm, images, agent:profiles!properties_agent_id_fkey(id, full_name, profile_photo_url, phone, is_verified, verified_expires_at)";

function AccountPage() {
  const { user, profile, isAgent, isAdmin, loading, signOut, refresh } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"saved" | "reviews" | "profile">("saved");

  useEffect(() => {
    if (!loading && (isAgent || isAdmin)) navigate({ to: "/dashboard", replace: true });
  }, [loading, isAgent, isAdmin, navigate]);

  const saved = useQuery({
    queryKey: ["saved-properties", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_properties")
        .select(`property_id, created_at, property:properties(${PROPERTY_SELECT})`)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((r) => (r as unknown as { property: PropertyCardData | null }).property)
        .filter(Boolean) as PropertyCardData[];
    },
  });

  const reviews = useQuery({
    queryKey: ["my-reviews", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_reviews")
        .select("id, agent_id, communication, accuracy, professionalism, recommends, comment, created_at, agent:profiles!agent_reviews_agent_id_fkey(id, full_name, profile_photo_url)")
        .eq("client_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [fullName, setFullName] = useState("");
  const [dial, setDial] = useState(DEFAULT_DIAL);
  const [localPhone, setLocalPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    const parts = splitPhone(profile.phone ?? "");
    setDial(parts.dial);
    setLocalPhone(parts.local);
  }, [profile]);

  const saveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone: joinPhone(dial, localPhone) } as never)
      .eq("id", profile.id);
    setSavingProfile(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    refresh();
  };

  const removeReview = async (id: string) => {
    const { error } = await supabase.from("agent_reviews").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Review deleted");
    void qc.invalidateQueries({ queryKey: ["my-reviews", user?.id] });
  };

  const tabs = [
    { key: "saved" as const, label: "Saved homes" },
    { key: "reviews" as const, label: "My reviews" },
    { key: "profile" as const, label: "Profile" },
  ];

  return (
    <SiteShell>
      <div className="mx-auto max-w-[1100px] px-6 py-8 lg:px-10">
        <div className="flex items-center gap-4">
          {profile?.profile_photo_url ? (
            <img src={cldUrl(profile.profile_photo_url, 160)} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-brand text-xl font-bold text-brand-foreground">
              {(profile?.full_name || user?.email || "?").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{profile?.full_name || "Welcome"}</h1>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <p className="mt-4 rounded-2xl border border-border bg-muted/40 px-5 py-3 text-sm text-muted-foreground">
          This is your visitor account — save homes you like and review the agents you contact.{" "}
          <Link to="/register" className="font-semibold text-brand underline">Register as an agent</Link> if you want to list properties.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-t-xl px-4 py-2 text-sm font-semibold ${tab === t.key ? "border-b-2 border-brand text-brand" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "saved" && (
            saved.isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />)}
              </div>
            ) : (saved.data ?? []).length === 0 ? (
              <EmptyState
                icon={<Heart className="h-6 w-6" />}
                title="No saved homes yet"
                body="Tap the heart on any listing to keep it here."
                action={<Link to="/properties" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground">Browse listings</Link>}
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(saved.data ?? []).map((p) => <PropertyCard key={p.id} p={p} />)}
              </div>
            )
          )}

          {tab === "reviews" && (
            (reviews.data ?? []).length === 0 ? (
              <EmptyState
                icon={<Star className="h-6 w-6" />}
                title="You haven't reviewed an agent yet"
                body="After you contact an agent you can rate them on their profile."
                action={<Link to="/agents" search={{ q: "", city: "", agency: "" }} className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground">Find an agent</Link>}
              />
            ) : (
              <ul className="space-y-4">
                {(reviews.data ?? []).map((r) => {
                  const row = r as unknown as {
                    id: string; agent_id: string; communication: number; accuracy: number; professionalism: number;
                    recommends: boolean; comment: string; created_at: string;
                    agent: { full_name: string; profile_photo_url: string | null } | null;
                  };
                  return (
                    <li key={row.id} className="rounded-2xl border border-border p-5">
                      <div className="flex items-center justify-between gap-3">
                        <Link to="/agents/$id" params={{ id: row.agent_id }} className="flex items-center gap-3">
                          {row.agent?.profile_photo_url ? (
                            <img src={cldUrl(row.agent.profile_photo_url, 96)} alt="" className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
                              {row.agent?.full_name?.charAt(0) ?? "A"}
                            </span>
                          )}
                          <span className="font-semibold">{row.agent?.full_name ?? "Agent"}</span>
                        </Link>
                        <StarRating value={reviewScore(row)} />
                      </div>
                      {row.comment && <p className="mt-3 text-sm text-muted-foreground">{row.comment}</p>}
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(row.created_at).toLocaleDateString()}</span>
                        <button onClick={() => removeReview(row.id)} className="font-semibold text-destructive hover:underline">Delete</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          )}

          {tab === "profile" && (
            <div className="max-w-lg space-y-4">
              <div>
                <Label htmlFor="acc-name">Full name</Label>
                <Input id="acc-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="acc-phone">Phone (WhatsApp)</Label>
                <PhoneField id="acc-phone" dial={dial} local={localPhone} onDialChange={setDial} onLocalChange={setLocalPhone} />
              </div>
              <div className="flex gap-3">
                <Button onClick={saveProfile} disabled={savingProfile} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
                  {savingProfile ? "Saving…" : "Save changes"}
                </Button>
                <Button variant="outline" className="rounded-full" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}

function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</span>
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}
