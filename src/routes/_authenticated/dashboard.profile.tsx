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
import { PhotoCropper, safeStorageName } from "@/components/PhotoCropper";
import { uploadAvatar, cldUrl } from "@/lib/cloudinary";
import { UploadProgressOverlay } from "@/components/UploadProgressTile";
import { deleteUploads } from "@/lib/cloudinary.functions";
import { PhoneField } from "@/components/PhoneField";
import { DEFAULT_DIAL, joinPhone, splitPhone } from "@/lib/phone";
import { SPECIALIZATIONS } from "@/lib/listing-schema";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, refresh } = useAuth();
  const [f, setF] = useState({
    full_name: "", phone: "", address: "", agency_name: "", bio: "", profile_photo_url: "", achievements: "", photo_public_id: "",
    social_instagram: "", social_facebook: "", social_tiktok: "", social_linkedin: "", whatsapp_business: "",
    is_independent: true, specializations: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [dial, setDial] = useState(DEFAULT_DIAL);
  const [localPhone, setLocalPhone] = useState("");

  useEffect(() => {
    if (profile) {
      const parts = splitPhone(profile.phone);
      setDial(parts.dial);
      setLocalPhone(parts.local);
      setF({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      address: profile.address || "",
      agency_name: profile.agency_name || "",
      bio: profile.bio || "",
      profile_photo_url: profile.profile_photo_url || "",
      achievements: (profile as { achievements?: string }).achievements || "",
      photo_public_id: (profile as { photo_public_id?: string }).photo_public_id || "",
      social_instagram: (profile as { social_instagram?: string }).social_instagram || "",
      social_facebook: (profile as { social_facebook?: string }).social_facebook || "",
      social_tiktok: (profile as { social_tiktok?: string }).social_tiktok || "",
      social_linkedin: (profile as { social_linkedin?: string }).social_linkedin || "",
      whatsapp_business: (profile as { whatsapp_business?: string }).whatsapp_business || "",
      is_independent: (profile as { is_independent?: boolean }).is_independent ?? true,
      specializations: (profile as { specializations?: string[] }).specializations ?? [],
      });
    }
  }, [profile]);

  const pickFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setPending(file);
  };

  const uploadCropped = async (blob: Blob) => {
    if (!profile || !pending) return;
    setPending(null);
    setUploading(true);
    setPercent(0);
    const localPreview = URL.createObjectURL(blob);
    setPreviewUrl(localPreview);
    const name = safeStorageName(pending.name).replace(/\.[a-z]+$/, ".jpg");
    const previous = f.photo_public_id;
    try {
      const { url, publicId } = await uploadAvatar(blob, name, setPercent);
      setF((prev) => ({ ...prev, profile_photo_url: url, photo_public_id: publicId }));
      if (previous) void deleteUploads({ data: { publicIds: [previous] } }).catch(() => {});
      toast.success("Photo uploaded — remember to save changes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
    URL.revokeObjectURL(localPreview);
    setPreviewUrl(null);
    setUploading(false);
  };

  const save = async () => {
    if (!profile) return;
    setLoading(true);
    const payload = { ...f, phone: joinPhone(dial, localPhone) };
    const { error } = await supabase.from("profiles").update(payload as never).eq("id", profile.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setF(payload);
    toast.success("Profile updated");
    refresh();
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-5">
        <div className="relative h-28 w-24 shrink-0">
          {previewUrl || f.profile_photo_url ? (
            <img src={previewUrl ?? cldUrl(f.profile_photo_url, 300)} alt="Profile" className="h-full w-full rounded-md border border-border object-cover shadow-sm" />
          ) : (
            <div className="grid h-full w-full place-items-center rounded-md border border-dashed border-border bg-muted text-xs text-muted-foreground">Passport photo</div>
          )}
          {uploading && <UploadProgressOverlay percent={percent} />}
        </div>
        <div>
          <Label className="mb-1 block">Profile photo (passport style)</Label>
          <p className="mb-2 text-xs text-muted-foreground">Clear head-and-shoulders photo, plain background. Max 5MB.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickFile(f);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-full">
            <Upload className="mr-2 h-4 w-4" />{uploading ? "Uploading…" : f.profile_photo_url ? "Change photo" : "Upload photo"}
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div>
          <Label>Phone (WhatsApp)</Label>
          <PhoneField dial={dial} local={localPhone} onDialChange={setDial} onLocalChange={setLocalPhone} />
          <p className="mt-1 text-[11px] text-muted-foreground">Saved as +{dial}… so WhatsApp inquiries reach you.</p>
        </div>
        <div><Label>Agency name</Label><Input value={f.agency_name} onChange={(e) => setF({ ...f, agency_name: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div className="md:col-span-2"><Label>Office address</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div className="md:col-span-2"><Label>Bio</Label><Textarea rows={4} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} className="mt-1 rounded-xl" /></div>
        <div className="md:col-span-2"><Label>Achievements & awards</Label><Textarea rows={4} value={f.achievements} onChange={(e) => setF({ ...f, achievements: e.target.value })} placeholder="Top seller 2025, 100+ successful deals…" className="mt-1 rounded-xl" /></div>

        <div className="md:col-span-2 rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="independent">Independent agent</Label>
              <p className="text-xs text-muted-foreground">Turn off if you work under an agency.</p>
            </div>
            <Switch id="independent" checked={f.is_independent} onCheckedChange={(v) => setF({ ...f, is_independent: v })} />
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-border p-4">
          <Label>What you specialise in</Label>
          <p className="mt-1 text-xs text-muted-foreground">Shown as tags on your public profile.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((s) => {
              const on = f.specializations.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setF((prev) => ({
                    ...prev,
                    specializations: on ? prev.specializations.filter((x) => x !== s) : [...prev.specializations, s],
                  }))}
                  className={`rounded-full border px-3 py-1 text-sm transition ${on ? "border-brand bg-brand text-brand-foreground" : "border-border hover:bg-muted"}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-border p-4">
          <Label>Social links (optional)</Label>
          <p className="mt-1 text-xs text-muted-foreground">Paste full links, e.g. https://instagram.com/yourname</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div><Label className="text-xs">Instagram</Label><Input value={f.social_instagram} onChange={(e) => setF({ ...f, social_instagram: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">Facebook</Label><Input value={f.social_facebook} onChange={(e) => setF({ ...f, social_facebook: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">TikTok</Label><Input value={f.social_tiktok} onChange={(e) => setF({ ...f, social_tiktok: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">LinkedIn</Label><Input value={f.social_linkedin} onChange={(e) => setF({ ...f, social_linkedin: e.target.value })} className="mt-1 rounded-xl" /></div>
            <div className="md:col-span-2"><Label className="text-xs">WhatsApp Business link</Label><Input value={f.whatsapp_business} onChange={(e) => setF({ ...f, whatsapp_business: e.target.value })} className="mt-1 rounded-xl" placeholder="https://wa.me/2507…" /></div>
          </div>
        </div>
      </div>
      <Button onClick={save} disabled={loading || uploading} className="mt-6 rounded-full bg-brand text-brand-foreground hover:bg-brand/90">{loading ? "Saving…" : "Save changes"}</Button>
      <PhotoCropper open={!!pending} file={pending} onCancel={() => setPending(null)} onConfirm={uploadCropped} />
    </div>
  );
}