import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_listings",
  title: "List my listings",
  description: "List the property listings owned by the signed-in agent on LoyalityReal250.",
  inputSchema: {
    status: z.enum(["active", "sold", "rented"]).optional().describe("Filter by listing status."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum listings to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("properties")
      .select("id, title, price, city, location, category, property_type, status, bedrooms, bathrooms, created_at")
      .eq("agent_id", ctx.getUserId()!)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { listings: data ?? [] },
    };
  },
});
