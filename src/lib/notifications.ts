import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  url: string;
  read_at: string | null;
  created_at: string;
}

export function useNotifications(userId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, title, body, url, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
  });

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => void qc.invalidateQueries({ queryKey: ["notifications", userId] }),
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [userId, qc]);

  return query;
}

export async function markNotificationsRead(ids: string[]) {
  if (ids.length === 0) return;
  await supabase.from("notifications").update({ read_at: new Date().toISOString() } as never).in("id", ids);
}
