import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_properties",
  title: "Search properties",
  description: "Search active LoyalityReal250 listings by city, category, sale/rent type and price range.",
  inputSchema: {
    city: z.string().trim().optional(),
    category: z.enum(["house", "apartment", "land", "commercial", "villa", "car", "motorcycle"]).optional(),
    property_type: z.enum(["sale", "rent"]).optional(),
    min_price: z.number().nonnegative().optional(),
    max_price: z.number().nonnegative().optional(),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ city, category, property_type, min_price, max_price, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("properties")
      .select("id, title, price, city, location, category, property_type, bedrooms, bathrooms, area_sqm, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (city) query = query.ilike("city", `%${city}%`);
    if (category) query = query.eq("category", category);
    if (property_type) query = query.eq("property_type", property_type);
    if (min_price !== undefined) query = query.gte("price", min_price);
    if (max_price !== undefined) query = query.lte("price", max_price);
    const { data, error } = await query;
    if (error) throw new ToolError(error.message);
    return { content: [{ type: "text", text: JSON.stringify(data ?? []) }], structuredContent: { results: data ?? [] } };
  },
});
