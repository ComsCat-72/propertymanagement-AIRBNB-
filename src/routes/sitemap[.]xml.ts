import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site";
import { LANDINGS } from "@/lib/seo-landing";

const BASE_URL = SITE_URL;

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/properties", changefreq: "daily", priority: "0.9" },
          { path: "/agents", changefreq: "weekly", priority: "0.8" },
        ];

        entries.push({ path: "/rwanda", changefreq: "weekly", priority: "0.8" });
        for (const l of LANDINGS) {
          entries.push({ path: `/rwanda/${l.slug}`, changefreq: "daily", priority: "0.9" });
        }

        const { data: properties } = await supabase
          .from("properties")
          .select("id")
          .eq("status", "active")
          .limit(5000);
        for (const p of properties ?? []) {
          entries.push({ path: `/properties/${p.id}`, changefreq: "weekly", priority: "0.7" });
        }

        const { data: agents } = await supabase
          .from("profiles")
          .select("id")
          .eq("status", "active")
          .limit(5000);
        for (const a of agents ?? []) {
          entries.push({ path: `/agents/${a.id}`, changefreq: "weekly", priority: "0.6" });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});