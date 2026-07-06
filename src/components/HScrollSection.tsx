import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PropertyCard, type PropertyCardData } from "./PropertyCard";

interface Props {
  title: string;
  subtitle?: string;
  items: PropertyCardData[];
  linkTo?: string;
  linkSearch?: Record<string, string>;
}

export function HScrollSection({ title, subtitle, items, linkTo = "/properties", linkSearch }: Props) {
  if (items.length === 0) return null;
  return (
    <section className="pt-6">
      <div className="mb-3 flex items-end justify-between gap-3 px-4 lg:px-10">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Link
          to={linkTo}
          search={linkSearch as never}
          aria-label="See all"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border transition hover:bg-muted"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:px-10 [&::-webkit-scrollbar]:hidden">
        {items.map((p) => (
          <div key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[45%] md:w-[32%] lg:w-[24%]">
            <PropertyCard p={p} />
          </div>
        ))}
      </div>
    </section>
  );
}