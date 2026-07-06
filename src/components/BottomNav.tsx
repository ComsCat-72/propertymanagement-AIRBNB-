import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Heart, User as UserIcon, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { user, isAgent } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/", label: "Explore", icon: Search, match: (p: string) => p === "/" || p.startsWith("/properties") },
    { to: "/agents", label: "Agents", icon: Heart, match: (p: string) => p.startsWith("/agents") },
    user
      ? {
          to: isAgent ? "/dashboard" : "/dashboard/profile",
          label: "Account",
          icon: isAgent ? LayoutDashboard : UserIcon,
          match: (p: string) => p.startsWith("/dashboard") || p.startsWith("/admin"),
        }
      : { to: "/login", label: "Log in", icon: UserIcon, match: (p: string) => p.startsWith("/login") || p.startsWith("/register") },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 lg:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <li key={it.label} className="flex-1">
              <Link
                to={it.to as never}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg py-1 text-[11px] font-semibold transition",
                  active ? "text-brand" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("h-6 w-6", active && "stroke-[2.4]")} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
