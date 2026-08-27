import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { WEEKDAYS, minutesToLabel } from "@/lib/growth";

export const Route = createFileRoute("/_authenticated/dashboard/viewings")({
  component: ViewingsPage,
});

interface SlotRow { id: string; weekday: number; start_minute: number; end_minute: number }
interface BookingRow {
  id: string; starts_at: string; status: string; client_name: string; client_phone: string; note: string;
  property_id: string | null;
}

const TIMES = Array.from({ length: 29 }, (_, i) => 7 * 60 + i * 30); // 07:00 → 21:00

function ViewingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState(9 * 60);
  const [end, setEnd] = useState(17 * 60);

  const slots = useQuery({
    queryKey: ["my-slots", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("viewing_slots").select("*").eq("agent_id", user!.id).order("weekday");
      if (error) throw error;
      return (data ?? []) as unknown as SlotRow[];
    },
  });

  const bookings = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viewing_bookings")
        .select("id, starts_at, status, client_name, client_phone, note, property_id")
        .eq("agent_id", user!.id)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as BookingRow[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`agent-bookings-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "viewing_bookings", filter: `agent_id=eq.${user.id}` },
        () => void qc.invalidateQueries({ queryKey: ["my-bookings", user.id] }))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user, qc]);

  const addSlot = async () => {
    if (!user) return;
    if (end <= start) { toast.error("End time must be after the start time"); return; }
    const { error } = await supabase.from("viewing_slots").insert({
      agent_id: user.id, weekday, start_minute: start, end_minute: end,
    } as never);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["my-slots", user.id] });
  };

  const removeSlot = async (id: string) => {
    await supabase.from("viewing_slots").delete().eq("id", id);
    void qc.invalidateQueries({ queryKey: ["my-slots", user?.id] });
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("viewing_bookings").update({ status } as never).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Viewing ${status}`);
    void qc.invalidateQueries({ queryKey: ["my-bookings", user?.id] });
  };

  const upcoming = (bookings.data ?? []).filter((b) => new Date(b.starts_at) >= new Date());
  const past = (bookings.data ?? []).filter((b) => new Date(b.starts_at) < new Date());

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand"><CalendarClock className="h-5 w-5" /></span>
          <div>
            <h2 className="text-xl font-bold">Weekly availability</h2>
            <p className="mt-1 text-sm text-muted-foreground">Visitors on your public page can only book inside these windows.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="v-day">Day</Label>
            <select id="v-day" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className="mt-1 h-11 w-full rounded-full border border-border bg-background px-4 text-sm">
              {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="v-start">From</Label>
            <select id="v-start" value={start} onChange={(e) => setStart(Number(e.target.value))} className="mt-1 h-11 w-full rounded-full border border-border bg-background px-4 text-sm">
              {TIMES.map((t) => <option key={t} value={t}>{minutesToLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="v-end">To</Label>
            <select id="v-end" value={end} onChange={(e) => setEnd(Number(e.target.value))} className="mt-1 h-11 w-full rounded-full border border-border bg-background px-4 text-sm">
              {TIMES.map((t) => <option key={t} value={t}>{minutesToLabel(t)}</option>)}
            </select>
          </div>
          <Button onClick={addSlot} className="h-11 rounded-full bg-brand text-brand-foreground hover:bg-brand/90"><Plus className="mr-1.5 h-4 w-4" /> Add</Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(slots.data ?? []).map((s) => (
            <span key={s.id} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm">
              {WEEKDAYS[s.weekday]} · {minutesToLabel(s.start_minute)}–{minutesToLabel(s.end_minute)}
              <button onClick={() => void removeSlot(s.id)} aria-label="Remove availability" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </span>
          ))}
          {(slots.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No availability set yet.</p>}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold">Upcoming viewings ({upcoming.length})</h3>
        <div className="mt-3 space-y-2">
          {upcoming.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{new Date(b.starts_at).toLocaleString()}</p>
                <p className="truncate text-muted-foreground">{b.client_name} · {b.client_phone}</p>
                {b.note && <p className="truncate text-xs text-muted-foreground">"{b.note}"</p>}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b.status === "confirmed" ? "bg-brand/10 text-brand" : b.status === "pending" ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"}`}>{b.status}</span>
              {b.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => void setStatus(b.id, "confirmed")}>Confirm</Button>
                  <Button size="sm" variant="outline" className="rounded-full text-destructive" onClick={() => void setStatus(b.id, "declined")}>Decline</Button>
                </div>
              )}
            </div>
          ))}
          {upcoming.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No upcoming viewings.</p>}
        </div>
      </section>

      {past.length > 0 && (
        <section>
          <h3 className="text-lg font-bold">Past</h3>
          <div className="mt-3 space-y-2">
            {past.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-4 text-sm text-muted-foreground">
                <span>{new Date(b.starts_at).toLocaleString()}</span>
                <span>{b.client_name}</span>
                <span className="ml-auto capitalize">{b.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
