import { Link, useRouterState } from "@tanstack/react-router";
import { Search, Heart, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/", label: "Explore", icon: Search, active: pathname === "/" || pathname.startsWith("/properties") },
    { to: "/agents", label: "Agents", icon: Heart, active: pathname.startsWith("/agents") },
    user
      ? { to: "/dashboard", label: "Account", icon: UserIcon, active: pathname.startsWith("/dashboard") || pathname.startsWith("/admin") }
      : { to: "/login", label: "Log in", icon: UserIcon, active: pathname.startsWith("/login") || pathname.startsWith("/register") },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background lg:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {items.map(({ to, label, icon: Icon, active }) => (
          <li key={label} className="flex-1">
            <Link
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-1 text-[11px] font-semibold transition",
                active ? "text-accent" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-6 w-6", active && "fill-accent/10")} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}