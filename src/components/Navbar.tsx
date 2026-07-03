import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Menu, User as UserIcon, LogOut, LayoutDashboard, Shield, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, profile, isAdmin, isAgent, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top row */}
      <div className="mx-auto flex h-16 max-w-[1760px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-10">
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

        {/* Compact search pill (mobile/tablet) */}
        <button
          onClick={() => navigate({ to: "/properties" })}
          className="mx-2 flex flex-1 items-center gap-3 rounded-full border border-border bg-background py-2.5 px-4 shadow-sm transition hover:shadow-md lg:hidden"
          aria-label="Search properties"
        >
          <Search className="h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-sm font-semibold">Start your search</div>
          </div>
        </button>

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

      {/* Expanded search pill (desktop only) */}
      <div className="hidden justify-center pb-4 lg:flex">
        <button
          onClick={() => navigate({ to: "/properties" })}
          className="group flex h-16 w-full max-w-[860px] items-center rounded-full border border-border bg-background pl-2 pr-2 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] transition hover:shadow-[0_2px_4px_rgba(0,0,0,0.12),0_8px_20px_rgba(0,0,0,0.08)]"
        >
          <span className="flex-1 rounded-full px-6 py-2 text-left transition hover:bg-muted">
            <span className="block text-xs font-semibold">Where</span>
            <span className="block truncate text-sm text-muted-foreground">Search destinations</span>
          </span>
          <span className="h-8 w-px bg-border" />
          <span className="flex-1 rounded-full px-6 py-2 text-left transition hover:bg-muted">
            <span className="block text-xs font-semibold">Property type</span>
            <span className="block truncate text-sm text-muted-foreground">Any type</span>
          </span>
          <span className="h-8 w-px bg-border" />
          <span className="flex-1 rounded-full px-6 py-2 text-left transition hover:bg-muted">
            <span className="block text-xs font-semibold">Price</span>
            <span className="block truncate text-sm text-muted-foreground">Any budget</span>
          </span>
          <span className="ml-2 flex h-12 items-center gap-2 rounded-full bg-brand pl-4 pr-5 text-brand-foreground">
            <Search className="h-4 w-4" />
            <span className="text-sm font-semibold">Search</span>
          </span>
        </button>
      </div>
    </header>
  );
}