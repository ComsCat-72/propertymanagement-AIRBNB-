import { createServerFn } from "@tanstack/react-start";

export interface ChatListing {
  title: string;
  city: string;
  location: string;
  price: number;
  property_type: string;
  category: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
}

export interface ChatInput {
  agentName: string;
  agentBio: string;
  listings: ChatListing[];
  messages: { role: "user" | "assistant"; content: string }[];
}

function validate(input: ChatInput): ChatInput {
  return {
    agentName: String(input.agentName ?? "").slice(0, 120),
    agentBio: String(input.agentBio ?? "").slice(0, 1000),
    listings: (input.listings ?? []).slice(0, 25),
    messages: (input.messages ?? []).slice(-12).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, 1500),
    })),
  };
}

export const askAgentAssistant = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { reply: "", error: "The assistant is not configured yet." };

    const catalogue = data.listings
      .map(
        (l) =>
          `- ${l.title} | ${l.category} for ${l.property_type} | ${l.location ? l.location + ", " : ""}${l.city} | RWF ${Math.round(l.price).toLocaleString("en-US")} | ${l.bedrooms} bed, ${l.bathrooms} bath, ${l.area_sqm}m2`,
      )
      .join("\n");

    const system = [
      `You are the assistant on the Ibyungura.com page of ${data.agentName}, a property agent in Rwanda.`,
      data.agentBio ? `About the agent: ${data.agentBio}` : "",
      "Answer questions about the agent's listings using only the catalogue below.",
      "If something is not in the catalogue, say so briefly and invite the visitor to message the agent on WhatsApp or book a viewing.",
      "Keep answers under 90 words, friendly and concrete. Prices are Rwandan francs (RWF).",
      "",
      "Catalogue:",
      catalogue || "(no active listings right now)",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: system }, ...data.messages],
        }),
      });
      if (res.status === 429) return { reply: "", error: "The assistant is busy right now — please try again shortly." };
      if (!res.ok) return { reply: "", error: "The assistant is unavailable right now." };
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return { reply: json.choices?.[0]?.message?.content ?? "", error: "" };
    } catch {
      return { reply: "", error: "The assistant is unavailable right now." };
    }
  });
