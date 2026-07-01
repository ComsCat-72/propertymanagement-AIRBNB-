import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, refresh } = useAuth();
  const [f, setF] = useState({ full_name: "", phone: "", address: "", agency_name: "", bio: "", profile_photo_url: "", achievements: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) setF({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      address: profile.address || "",
      agency_name: profile.agency_name || "",
      bio: profile.bio || "",
      profile_photo_url: profile.profile_photo_url || "",
      achievements: (profile as { achievements?: string }).achievements || "",
    });
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update(f as never).eq("id", profile.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    refresh();
  };

  return (
    <div className="max-w-2xl">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div><Label>Agency name</Label><Input value={f.agency_name} onChange={(e) => setF({ ...f, agency_name: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div className="md:col-span-2"><Label>Office address</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div className="md:col-span-2"><Label>Profile photo URL</Label><Input value={f.profile_photo_url} onChange={(e) => setF({ ...f, profile_photo_url: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div className="md:col-span-2"><Label>Bio</Label><Textarea rows={4} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div className="md:col-span-2"><Label>Achievements & awards</Label><Textarea rows={4} value={f.achievements} onChange={(e) => setF({ ...f, achievements: e.target.value })} placeholder="Top seller 2025, 100+ successful deals…" className="mt-1 rounded-xl" /></div>
      </div>
      <Button onClick={save} disabled={loading} className="mt-6 rounded-full bg-brand text-brand-foreground hover:bg-brand/90">{loading ? "Saving…" : "Save changes"}</Button>
    </div>
  );
}