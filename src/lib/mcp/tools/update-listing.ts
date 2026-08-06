import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_listing",
  title: "Update listing",
  description: "Update fields of one of the signed-in agent's listings, such as price, status or description.",
  inputSchema: {
    id: z.string().describe("The listing id."),
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
    price: z.number().nonnegative().optional(),
    city: z.string().trim().optional(),
    location: z.string().trim().optional(),
    status: z.enum(["active", "sold", "rented"]).optional(),
    property_type: z.enum(["sale", "rent"]).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ id, ...changes }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const patch = Object.fromEntries(Object.entries(changes).filter(([, v]) => v !== undefined));
    if (Object.keys(patch).length === 0) throw new ToolError("Provide at least one field to update");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("properties")
      .update(patch)
      .eq("id", id)
      .eq("agent_id", ctx.getUserId()!)
      .select("id, title, price, status, city, location, property_type")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Listing not found or not owned by you");
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { listing: data } };
  },
});
