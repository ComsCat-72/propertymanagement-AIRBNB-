import { Home, Building2, Trees, Briefcase, Castle, Tag, KeyRound, LayoutGrid, Car, Bike } from "lucide-react";

export const CATEGORIES = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "house", label: "House", icon: Home },
  { id: "apartment", label: "Apartment", icon: Building2 },
  { id: "land", label: "Land", icon: Trees },
  { id: "commercial", label: "Commercial", icon: Briefcase },
  { id: "villa", label: "Villa", icon: Castle },
  { id: "car", label: "Cars", icon: Car },
  { id: "motorcycle", label: "Motorcycles", icon: Bike },
  { id: "sale", label: "For Sale", icon: Tag },
  { id: "rent", label: "For Rent", icon: KeyRound },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function CategoryPills({ active, onChange }: { active: CategoryId; onChange: (id: CategoryId) => void }) {
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-[1760px] overflow-x-auto px-4 lg:px-10 [&::-webkit-scrollbar]:hidden">
        {/* Mobile / tablet: Airbnb-style rounded pill chips */}
        <div className="flex min-w-max items-center gap-2 py-3 lg:hidden">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-foreground bg-background text-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
        {/* Desktop: underline tabs */}
        <div className="hidden min-w-max items-center gap-8 py-4 lg:flex">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className={`flex flex-col items-center gap-1.5 border-b-2 pb-2 text-xs font-semibold transition ${
                  isActive ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}