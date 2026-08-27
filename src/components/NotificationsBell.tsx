import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/lib/auth";
import { markNotificationsRead, useNotifications } from "@/lib/notifications";

export function NotificationsBell() {
  const { user } = useAuth();
  const { data } = useNotifications(user?.id);
  if (!user) return null;

  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at);

  return (
    <Popover
      onOpenChange={(open) => {
        if (open && unread.length) void markNotificationsRead(unread.map((n) => n.id));
      }}
    >
      <PopoverTrigger asChild>
        <button
          aria-label={unread.length ? `${unread.length} unread notifications` : "Notifications"}
          className="relative grid h-10 w-10 place-items-center rounded-full border border-border transition hover:bg-muted"
        >
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-0">
        <p className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</p>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul className="max-h-96 divide-y divide-border overflow-y-auto">
            {items.map((n) => (
              <li key={n.id} className={n.read_at ? "" : "bg-brand/5"}>
                <Link to={n.url || "/"} className="block px-4 py-3">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
