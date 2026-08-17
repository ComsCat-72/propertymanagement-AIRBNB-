import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ThumbsUp, MessageSquareQuote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StarRating } from "@/components/StarRating";
import { cldUrl } from "@/lib/cloudinary";

export interface ReviewRow {
  id: string;
  client_id: string;
  communication: number;
  accuracy: number;
  professionalism: number;
  recommends: boolean;
  comment: string;
  created_at: string;
  client: { full_name: string; profile_photo_url: string | null } | null;
}

/** Weighted overall score: communication 40%, accuracy 35%, professionalism 25%. */
export function reviewScore(r: Pick<ReviewRow, "communication" | "accuracy" | "professionalism">) {
  return r.communication * 0.4 + r.accuracy * 0.35 + r.professionalism * 0.25;
}

export function AgentReviews({ agentId }: { agentId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [communication, setCommunication] = useState(5);
  const [accuracy, setAccuracy] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [recommends, setRecommends] = useState(true);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ["agent-reviews", agentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_reviews")
        .select("id, client_id, communication, accuracy, professionalism, recommends, comment, created_at, client:profiles!agent_reviews_client_id_fkey(full_name, profile_photo_url)")
        .eq("agent_id", agentId)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as ReviewRow[];
    },
  });

  const { data: canReview } = useQuery({
    queryKey: ["can-review", agentId, user?.id],
    enabled: !!user && user.id !== agentId,
    queryFn: async () => {
      const [{ count: inquiries }, { count: mine }] = await Promise.all([
        supabase.from("agent_inquiries").select("id", { count: "exact", head: true }).eq("agent_id", agentId).eq("client_id", user!.id),
        supabase.from("agent_reviews").select("id", { count: "exact", head: true }).eq("agent_id", agentId).eq("client_id", user!.id),
      ]);
      return (inquiries ?? 0) > 0 && (mine ?? 0) === 0;
    },
  });

  const list = reviews ?? [];
  const avg = list.length ? list.reduce((s, r) => s + reviewScore(r), 0) / list.length : 0;
  const recommendRate = list.length ? Math.round((list.filter((r) => r.recommends).length / list.length) * 100) : 0;

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("agent_reviews").insert({
      agent_id: agentId,
      client_id: user.id,
      communication,
      accuracy,
      professionalism,
      recommends,
      comment: comment.trim().slice(0, 300),
    } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks — your review is live");
    setComment("");
    qc.invalidateQueries({ queryKey: ["agent-reviews", agentId] });
    qc.invalidateQueries({ queryKey: ["can-review", agentId, user.id] });
  };

  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MessageSquareQuote className="h-5 w-5 text-brand" /> Client reviews
        </h2>
        {list.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <StarRating value={avg} />
            <span className="font-semibold">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground">({list.length} review{list.length === 1 ? "" : "s"})</span>
            <span className="flex items-center gap-1 text-muted-foreground"><ThumbsUp className="h-3.5 w-3.5" /> {recommendRate}% recommend</span>
          </div>
        )}
      </div>

      {list.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No reviews yet. Clients can review this agent after contacting them.</p>}

      <div className="mt-4 space-y-4">
        {list.map((r) => (
          <article key={r.id} className="rounded-2xl border border-border p-4">
            <div className="flex items-center gap-3">
              {r.client?.profile_photo_url ? (
                <img src={cldUrl(r.client.profile_photo_url, 96)} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-bold">{(r.client?.full_name || "?").charAt(0)}</span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{r.client?.full_name || "Client"}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <div className="ml-auto"><StarRating value={reviewScore(r)} size="sm" /></div>
            </div>
            {r.comment && <p className="mt-3 text-sm leading-relaxed text-foreground/80">{r.comment}</p>}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span>Communication {r.communication}/5</span>
              <span>Listing accuracy {r.accuracy}/5</span>
              <span>Professionalism {r.professionalism}/5</span>
            </div>
          </article>
        ))}
      </div>

      {canReview && (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-4">
          <h3 className="font-semibold">Rate your experience</h3>
          <p className="mt-1 text-xs text-muted-foreground">Only clients who contacted this agent can leave a review — one review per agent.</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between"><Label>Communication</Label><StarRating value={communication} onChange={setCommunication} label="communication" /></div>
            <div className="flex items-center justify-between"><Label>Listing accuracy</Label><StarRating value={accuracy} onChange={setAccuracy} label="listing accuracy" /></div>
            <div className="flex items-center justify-between"><Label>Professionalism</Label><StarRating value={professionalism} onChange={setProfessionalism} label="professionalism" /></div>
            <div className="flex items-center justify-between">
              <Label htmlFor="recommends">I'd recommend this agent</Label>
              <Switch id="recommends" checked={recommends} onCheckedChange={setRecommends} />
            </div>
            <div>
              <Label htmlFor="review-comment">Comment (optional)</Label>
              <Textarea id="review-comment" rows={3} maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} className="mt-1 rounded-xl" placeholder="How did the viewing and follow-up go?" />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">{comment.length}/300</p>
            </div>
            <Button onClick={submit} disabled={saving} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
              {saving ? "Publishing…" : "Publish review"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
