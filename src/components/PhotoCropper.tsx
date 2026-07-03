import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// Passport-style aspect (portrait ~ 24:28 ≈ 6:7)
const ASPECT = 6 / 7;

async function getCroppedBlob(imageSrc: string, area: Area, mime = "image/jpeg"): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), mime, 0.92),
  );
}

export function PhotoCropper({
  open,
  file,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  file: File | null;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  // Create/revoke object URL for the incoming file
  useState(() => {});
  if (file && !src) {
    const url = URL.createObjectURL(file);
    setSrc(url);
  }
  if (!file && src) {
    URL.revokeObjectURL(src);
    setSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const confirm = async () => {
    if (!src || !area) return;
    const blob = await getCroppedBlob(src, area);
    onConfirm(blob);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust your photo</DialogTitle>
        </DialogHeader>
        <div className="relative h-[360px] w-full overflow-hidden rounded-xl bg-muted">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT}
              cropShape="rect"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>
        <div className="px-1 pt-2">
          <label className="mb-2 block text-xs font-semibold text-muted-foreground">Zoom</label>
          <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={(v) => setZoom(v[0])} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} className="rounded-full">Cancel</Button>
          <Button onClick={confirm} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
            Use photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Sanitize a filename for Supabase Storage keys.
// Storage rejects [ ] and other non-URL-safe chars.
export function safeStorageName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "");
  const ext = (dot > 0 ? name.slice(dot + 1) : "jpg").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
  return `${base || "photo"}.${ext}`;
}