import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_account",
  title: "Get my account",
  description: "Get the signed-in agent's profile, subscription plan, verified badge status and listing count.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId()!;
    const [{ data: profile, error: profileError }, { count, error: countError }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, agency_name, status, plan, plan_expires_at, is_verified, verified_expires_at, cancel_at_period_end")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", userId),
    ]);
    if (profileError) throw new ToolError(profileError.message);
    if (countError) throw new ToolError(countError.message);
    const account = { ...(profile ?? {}), listing_count: count ?? 0 };
    return { content: [{ type: "text", text: JSON.stringify(account) }], structuredContent: { account } };
  },
});
