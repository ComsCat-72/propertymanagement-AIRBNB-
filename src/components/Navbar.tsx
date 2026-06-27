import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Menu, User as UserIcon, LogOut, LayoutDashboard, Shield } from "lucide-react";
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
      <div className="mx-auto flex h-20 max-w-[1760px] items-center justify-between gap-4 px-6 lg:px-10">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground font-bold">L</div>
          <span className="hidden text-lg font-bold tracking-tight text-brand sm:inline">LoyalityReal<span className="text-gold">250</span></span>
        </Link>

        <button
          onClick={() => navigate({ to: "/properties" })}
          className="hidden flex-1 max-w-md items-center rounded-full border border-border bg-background py-2 pl-6 pr-2 shadow-sm transition hover:shadow-md md:flex"
        >
          <span className="flex-1 text-left text-sm font-semibold">Anywhere</span>
          <span className="h-6 w-px bg-border" />
          <span className="flex-1 px-4 text-left text-sm font-semibold">Any type</span>
          <span className="h-6 w-px bg-border" />
          <span className="flex-1 px-4 text-left text-sm text-muted-foreground">Any price</span>
          <span className="ml-2 grid h-8 w-8 place-items-center rounded-full bg-brand text-brand-foreground">
            <Search className="h-4 w-4" />
          </span>
        </button>

        <nav className="flex shrink-0 items-center gap-2">
          <Link to="/properties" className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted lg:inline-block">Browse</Link>
          <Link to="/agents" className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted lg:inline-block">Agents</Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border py-1 pl-3 pr-1 hover:shadow-md">
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
            <>
              <Link to="/login"><Button variant="ghost" className="rounded-full font-semibold">Log in</Button></Link>
              <Link to="/register"><Button className="rounded-full bg-brand font-semibold text-brand-foreground hover:bg-brand/90">Sign up</Button></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}