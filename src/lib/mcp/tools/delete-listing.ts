import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "delete_listing",
  title: "Delete listing",
  description: "Permanently delete one of the signed-in agent's listings.",
  inputSchema: { id: z.string().describe("The listing id to delete.") },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id)
      .eq("agent_id", ctx.getUserId()!)
      .select("id")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Listing not found or not owned by you");
    return { content: [{ type: "text", text: `Deleted listing ${id}` }] };
  },
});
