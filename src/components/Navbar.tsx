import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Menu, User as UserIcon, LogOut, LayoutDashboard, Shield, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TYPE_OPTIONS = [
  { label: "Any type", value: "" },
  { label: "For sale", value: "sale" },
  { label: "For rent", value: "rent" },
];

const CATEGORY_OPTIONS = [
  { label: "Any category", value: "" },
  { label: "House", value: "house" },
  { label: "Apartment", value: "apartment" },
  { label: "Villa", value: "villa" },
  { label: "Land", value: "land" },
  { label: "Commercial", value: "commercial" },
  { label: "Car", value: "car" },
  { label: "Motorcycle", value: "motorcycle" },
];

const PRICE_RANGES = [
  { label: "Any budget", min: "", max: "" },
  { label: "Under 50,000", min: "", max: "50000" },
  { label: "50k – 200k", min: "50000", max: "200000" },
  { label: "200k – 500k", min: "200000", max: "500000" },
  { label: "500k – 1M", min: "500000", max: "1000000" },
  { label: "1M+", min: "1000000", max: "" },
];

function useScrollDirection() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    let last = typeof window !== "undefined" ? window.scrollY : 0;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 24) setCollapsed(false);
        else if (y > last + 12) setCollapsed(true);
        else if (y < last - 12) setCollapsed(false);
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return collapsed;
}

export function Navbar() {
  const { user, profile, isAdmin, isAgent, signOut } = useAuth();
  const navigate = useNavigate();
  const collapsed = useScrollDirection();

  const [where, setWhere] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [priceIdx, setPriceIdx] = useState(0);
  const [openWhere, setOpenWhere] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  const { data: locations } = useQuery({
    queryKey: ["distinct-locations"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("properties").select("city, location").eq("status", "active").limit(500);
      const set = new Set<string>();
      (data ?? []).forEach((r: { city?: string | null; location?: string | null }) => {
        if (r.city) set.add(r.city);
        if (r.location) set.add(r.location);
      });
      return Array.from(set).sort();
    },
  });

  const runSearch = () => {
    const range = PRICE_RANGES[priceIdx];
    const search: Record<string, string> = {};
    if (where) search.city = where;
    if (type) search.type = type;
    if (category) search.category = category;
    if (range.min) search.minPrice = range.min;
    if (range.max) search.maxPrice = range.max;
    navigate({ to: "/properties", search: search as never });
    setOpenWhere(false); setOpenType(false); setOpenPrice(false);
  };

  const priceLabel = PRICE_RANGES[priceIdx].label;
  const typeLabel = [...TYPE_OPTIONS, ...CATEGORY_OPTIONS].find((o) => o.value === (type || category))?.label ?? "Any type";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-transform duration-300 will-change-transform",
        collapsed ? "-translate-y-full lg:translate-y-0" : "translate-y-0",
      )}
    >
      {/* Top row — hidden on mobile (mobile uses search pill + bottom nav) */}
      <div className="mx-auto hidden h-16 max-w-[1760px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:flex lg:px-10">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground font-bold">L</div>
          <span className="hidden text-lg font-bold tracking-tight text-brand sm:inline">
            LoyalityReal<span className="text-gold">250</span>
          </span>
        </Link>

        {/* Center tabs (desktop only) */}
        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 text-sm font-semibold text-muted-foreground">
          <Link
            to="/properties"
            className="relative py-2 text-foreground after:absolute after:-bottom-0.5 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-foreground"
          >
            Homes
          </Link>
          <Link to="/agents" className="rounded-full px-2 py-2 hover:text-foreground">Agents</Link>
          <Link to="/properties" search={{ type: "rent" } as never} className="rounded-full px-2 py-2 hover:text-foreground">Rentals</Link>
        </nav>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            to="/register"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted lg:inline-block"
          >
            Become an agent
          </Link>
          <button
            type="button"
            aria-label="Choose language"
            className="hidden h-10 w-10 place-items-center rounded-full hover:bg-muted lg:grid"
          >
            <Globe className="h-4 w-4" />
          </button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border py-1 pl-3 pr-1 transition hover:shadow-md">
                  <Menu className="h-4 w-4" />
                  {profile?.profile_photo_url ? (
                    <img src={profile.profile_photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-brand-foreground">
                      <UserIcon className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold">{profile?.full_name || user.email}</div>
                <DropdownMenuSeparator />
                {isAgent && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <Shield className="mr-2 h-4 w-4" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/profile" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border py-1.5 pl-3 pr-1.5 transition hover:shadow-md">
                  <Menu className="h-4 w-4" />
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-neutral-700 text-white">
                    <UserIcon className="h-4 w-4" />
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate({ to: "/register" })}>Sign up</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/login" })}>Log in</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/register" })}>Become an agent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/agents" })}>Find an agent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/properties" })}>Browse homes</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile search pill — Airbnb-style single row */}
      <div className="lg:hidden">
        <div className="mx-auto max-w-[1760px] px-4 pb-3 pt-3 sm:px-6">
          <Popover open={openMobile} onOpenChange={setOpenMobile}>
            <PopoverTrigger asChild>
              <button
                className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-background px-6 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.06)]"
                aria-label="Start your search"
              >
                <Search className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                <span className="truncate text-[15px] font-semibold">{where || "Start your search"}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-[92vw] max-w-sm space-y-3 p-4">
              <div>
                <label className="text-xs font-semibold">Where</label>
                <select value={where} onChange={(e) => setWhere(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                  <option value="">Anywhere</option>
                  {(locations ?? []).map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Type</label>
                  <select value={type || category} onChange={(e) => {
                    const v = e.target.value;
                    if (v === "sale" || v === "rent" || v === "") { setType(v); setCategory(""); }
                    else { setCategory(v); setType(""); }
                  }} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                    {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    {CATEGORY_OPTIONS.slice(1).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold">Price</label>
                  <select value={priceIdx} onChange={(e) => setPriceIdx(Number(e.target.value))} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                    {PRICE_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => { runSearch(); setOpenMobile(false); }} className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                <Search className="h-4 w-4" /> Search
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Expanded search pill (desktop only) */}
      <div className="hidden justify-center pb-4 lg:flex">
        <div className="flex h-16 w-full max-w-[860px] items-center rounded-full border border-border bg-background pl-2 pr-2 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]">
          <Popover open={openWhere} onOpenChange={setOpenWhere}>
            <PopoverTrigger asChild>
              <button className="flex-1 rounded-full px-6 py-2 text-left transition hover:bg-muted">
                <span className="block text-xs font-semibold">Where</span>
                <span className="block truncate text-sm text-muted-foreground">{where || "Search destinations"}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-2">
              <div className="max-h-72 overflow-y-auto">
                <button onClick={() => { setWhere(""); setOpenWhere(false); }} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted">Anywhere</button>
                {(locations ?? []).map((l) => (
                  <button key={l} onClick={() => { setWhere(l); setOpenWhere(false); }} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted">{l}</button>
                ))}
                {(locations ?? []).length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No locations yet</p>}
              </div>
            </PopoverContent>
          </Popover>
          <span className="h-8 w-px bg-border" />
          <Popover open={openType} onOpenChange={setOpenType}>
            <PopoverTrigger asChild>
              <button className="flex-1 rounded-full px-6 py-2 text-left transition hover:bg-muted">
                <span className="block text-xs font-semibold">Property type</span>
                <span className="block truncate text-sm text-muted-foreground">{typeLabel}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-64 p-2">
              <p className="px-3 pt-1 text-[11px] font-semibold uppercase text-muted-foreground">Listing type</p>
              {TYPE_OPTIONS.map((o) => (
                <button key={o.value} onClick={() => { setType(o.value); setCategory(""); setOpenType(false); }} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted">{o.label}</button>
              ))}
              <p className="mt-2 px-3 pt-1 text-[11px] font-semibold uppercase text-muted-foreground">Category</p>
              {CATEGORY_OPTIONS.slice(1).map((o) => (
                <button key={o.value} onClick={() => { setCategory(o.value); setType(""); setOpenType(false); }} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted">{o.label}</button>
              ))}
            </PopoverContent>
          </Popover>
          <span className="h-8 w-px bg-border" />
          <Popover open={openPrice} onOpenChange={setOpenPrice}>
            <PopoverTrigger asChild>
              <button className="flex-1 rounded-full px-6 py-2 text-left transition hover:bg-muted">
                <span className="block text-xs font-semibold">Price</span>
                <span className="block truncate text-sm text-muted-foreground">{priceLabel}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              {PRICE_RANGES.map((r, i) => (
                <button key={i} onClick={() => { setPriceIdx(i); setOpenPrice(false); }} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted">{r.label}</button>
              ))}
            </PopoverContent>
          </Popover>
          <button onClick={runSearch} className="ml-2 flex h-12 items-center gap-2 rounded-full bg-brand pl-4 pr-5 text-brand-foreground transition hover:bg-brand/90">
            <Search className="h-4 w-4" />
            <span className="text-sm font-semibold">Search</span>
          </button>
        </div>
      </div>
    </header>
  );
}