import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ size = "md", withLabel = true }: { size?: "sm" | "md"; withLabel?: boolean }) {
  const sm = size === "sm";
  return (
    <span
      title="Verified agent"
      className={`inline-flex items-center gap-1 rounded-full bg-gold/15 font-semibold text-gold ${sm ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"}`}
    >
      <BadgeCheck className={sm ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {withLabel && "Verified"}
    </span>
  );
}
