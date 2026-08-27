import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Globe, ImagePlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadListingImage, cldUrl } from "@/lib/cloudinary";
import { slugify } from "@/lib/growth";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard/page")({
  component: ProPageEditor,
});

interface PageRow {
  agent_id: string; slug: string; tagline: string; banner_url: string; banner_public_id: string;
  ai_chat_enabled: boolean; viewings_enabled: boolean; slot_minutes: number;
}

function ProPageEditor() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [banner, setBanner] = useState("");
  const [bannerId, setBannerId] = useState("");
  const [aiChat, setAiChat] = useState(true);
  const [viewings, setViewings] = useState(true);
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const page = useQuery({
    queryKey: ["my-agent-page", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_pages").select("*").eq("agent_id", user!.id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as PageRow | null;
    },
  });

  const followers = useQuery({
    queryKey: ["my-followers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("agent_subscriptions").select("*", { count: "exact", head: true }).eq("agent_id", user!.id);
      return count ?? 0;
    },
  });

  useEffect(() => {
    const p = page.data;
    if (p) {
      setSlug(p.slug); setTagline(p.tagline); setBanner(p.banner_url); setBannerId(p.banner_public_id);
      setAiChat(p.ai_chat_enabled); setViewings(p.viewings_enabled); setSlotMinutes(p.slot_minutes);
    } else if (profile?.full_name) {
      setSlug(slugify(profile.full_name));
    }
  }, [page.data, profile?.full_name]);

  const pickBanner = async (file: File) => {
    setUploading(true);
    try {
      const up = await uploadListingImage(file);
      setBanner(up.url); setBannerId(up.publicId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!user) return;
    const clean = slugify(slug);
    if (clean.length < 3) { toast.error("Your web address needs at least 3 letters"); return; }
    setSaving(true);
    const payload = {
      agent_id: user.id, slug: clean, tagline: tagline.trim(), banner_url: banner, banner_public_id: bannerId,
      ai_chat_enabled: aiChat, viewings_enabled: viewings, slot_minutes: slotMinutes,
    };
    const { error } = await supabase.from("agent_pages").upsert(payload as never, { onConflict: "agent_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "That web address is already taken" : error.message);
      return;
    }
    setSlug(clean);
    toast.success("Your page is live");
    void qc.invalidateQueries({ queryKey: ["my-agent-page", user.id] });
  };

  const publicUrl = `${SITE_URL}/agent/${slugify(slug) || "your-name"}`;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand"><Globe className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold">Your Pro page</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A branded mini-site with your listings, an AI assistant that answers buyer questions, viewing bookings and a follow
              button that alerts your subscribers whenever you post.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="slug">Web address</Label>
            <div className="mt-1 flex items-center gap-2">
              <span className="shrink-0 text-sm text-muted-foreground">ibyungura.com/agent/</span>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-full" placeholder="your-name" />
            </div>
            {page.data && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> {publicUrl}
              </a>
            )}
          </div>

          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Textarea id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} rows={2} className="mt-1 rounded-2xl" placeholder="Helping families find homes in Kigali since 2018." />
          </div>

          <div>
            <Label>Banner image</Label>
            <div className="mt-1 flex items-center gap-3">
              {banner ? (
                <img src={cldUrl(banner, 480)} alt="" className="h-24 w-44 rounded-2xl object-cover" />
              ) : (
                <div className="grid h-24 w-44 place-items-center rounded-2xl border border-dashed border-border text-muted-foreground"><ImagePlus className="h-5 w-5" /></div>
              )}
              <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
                {uploading ? "Uploading…" : banner ? "Replace" : "Upload"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickBanner(f); }} />
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-2xl border border-border p-4 text-sm">
              <input type="checkbox" checked={aiChat} onChange={(e) => setAiChat(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--brand))]" />
              Enable the AI assistant on my page
            </label>
            <label className="flex items-center gap-2 rounded-2xl border border-border p-4 text-sm">
              <input type="checkbox" checked={viewings} onChange={(e) => setViewings(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--brand))]" />
              Let visitors book viewings
            </label>
          </div>

          <div>
            <Label htmlFor="slot-len">Viewing length</Label>
            <select id="slot-len" value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))} className="mt-1 h-11 w-full max-w-xs rounded-full border border-border bg-background px-4 text-sm">
              {[15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </div>

          <Button disabled={saving} onClick={save} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
            {saving ? "Saving…" : page.data ? "Save changes" : "Publish my page"}
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/15 text-gold"><Users className="h-5 w-5" /></span>
          <div>
            <p className="numeric text-2xl font-bold">{followers.data ?? 0}</p>
            <p className="text-sm text-muted-foreground">people get an alert when you post a matching listing</p>
          </div>
        </div>
      </section>
    </div>
  );
}
