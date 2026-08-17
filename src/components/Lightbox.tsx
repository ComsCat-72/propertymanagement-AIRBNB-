import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cldUrl } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export function Lightbox({ images, index, onClose, onIndexChange }: Props) {
  const [touchX, setTouchX] = useState<number | null>(null);
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange(((index as number) + 1) % images.length);
      if (e.key === "ArrowLeft") onIndexChange(((index as number) - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, index, images.length, onClose, onIndexChange]);

  if (!open) return null;
  const i = index as number;
  const go = (d: number) => onIndexChange((i + d + images.length) % images.length);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-neutral-950/97 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label="Property photos"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-semibold">{i + 1} / {images.length}</span>
        <button onClick={onClose} aria-label="Close photo viewer" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-2"
        onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          if (touchX === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          setTouchX(null);
        }}
      >
        <img src={cldUrl(images[i], 1600)} alt={`Photo ${i + 1}`} className="max-h-[72vh] max-w-full object-contain" />
        {images.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button onClick={() => go(1)} aria-label="Next photo" className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-4">
          {images.map((src, k) => (
            <button
              key={k}
              onClick={() => onIndexChange(k)}
              aria-label={`Show photo ${k + 1}`}
              className={cn(
                "h-16 w-24 shrink-0 overflow-hidden rounded-lg opacity-60 transition",
                k === i && "opacity-100 ring-2 ring-white",
              )}
            >
              <img src={cldUrl(src, 200)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
