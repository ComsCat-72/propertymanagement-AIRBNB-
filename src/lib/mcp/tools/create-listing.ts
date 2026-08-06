import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_listing",
  title: "Create listing",
  description: "Create a new property or vehicle listing for the signed-in agent. Subject to the agent's plan quota.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Listing title."),
    description: z.string().trim().optional().describe("Listing description."),
    price: z.number().nonnegative().describe("Price in RWF."),
    city: z.string().trim().optional().describe("City, e.g. Kigali."),
    location: z.string().trim().optional().describe("Neighbourhood or street location."),
    category: z.enum(["house", "apartment", "land", "commercial", "villa", "car", "motorcycle"]),
    property_type: z.enum(["sale", "rent"]),
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    area_sqm: z.number().min(0).optional(),
    images: z.array(z.string()).optional().describe("Public image URLs."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("properties")
      .insert({ ...input, agent_id: ctx.getUserId()! })
      .select("id, title, status, price, city, category, property_type")
      .single();
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { listing: data },
    };
  },
});
