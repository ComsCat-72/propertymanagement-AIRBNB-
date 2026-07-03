import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
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
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const uploadPhoto = async (file: File) => {
    if (!profile) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setUploading(true);
    const path = `avatars/${profile.id}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("property-images").upload(path, file, { upsert: false, contentType: file.type });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = await supabase.storage.from("property-images").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (data?.signedUrl) setF((prev) => ({ ...prev, profile_photo_url: data.signedUrl }));
    setUploading(false);
    toast.success("Photo uploaded — remember to save changes");
  };

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
      <div className="mb-6 flex items-center gap-5">
        {f.profile_photo_url ? (
          <img src={f.profile_photo_url} alt="Profile" className="h-28 w-24 rounded-md border border-border object-cover shadow-sm" />
        ) : (
          <div className="grid h-28 w-24 place-items-center rounded-md border border-dashed border-border bg-muted text-xs text-muted-foreground">Passport photo</div>
        )}
        <div>
          <Label className="mb-1 block">Profile photo (passport style)</Label>
          <p className="mb-2 text-xs text-muted-foreground">Clear head-and-shoulders photo, plain background. Max 5MB.</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-full">
            <Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading…" : f.profile_photo_url ? "Change photo" : "Upload photo"}
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div><Label>Agency name</Label><Input value={f.agency_name} onChange={(e) => setF({ ...f, agency_name: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div className="md:col-span-2"><Label>Office address</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div className="md:col-span-2"><Label>Bio</Label><Textarea rows={4} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div className="md:col-span-2"><Label>Achievements & awards</Label><Textarea rows={4} value={f.achievements} onChange={(e) => setF({ ...f, achievements: e.target.value })} placeholder="Top seller 2025, 100+ successful deals…" className="mt-1 rounded-xl" /></div>
      </div>
      <Button onClick={save} disabled={loading} className="mt-6 rounded-full bg-brand text-brand-foreground hover:bg-brand/90">{loading ? "Saving…" : "Save changes"}</Button>
    </div>
  );
}