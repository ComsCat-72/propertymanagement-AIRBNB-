import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = "md",
  label,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md";
  label?: string;
}) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-1" role={onChange ? "radiogroup" : undefined} aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const star = (
          <Star className={cn(cls, filled ? "fill-gold text-gold" : "text-muted-foreground/40")} />
        );
        return onChange ? (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n === 1 ? "" : "s"}${label ? ` for ${label}` : ""}`}>
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}
