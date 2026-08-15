import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";
import { SITE_URL } from "@/lib/site";
import { LANDINGS } from "@/lib/seo-landing";

const TITLE = "Property & Vehicle Guides for Rwanda | Ibyungura.com";
const DESC =
  "Jump straight to houses, apartments, land, commercial space and cars for sale or rent in Kigali and across Rwanda, with live agent listings.";

export const Route = createFileRoute("/rwanda/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/rwanda` },
      { property: "og:image", content: `${SITE_URL}/og-cover.jpg` },
      { name: "twitter:image", content: `${SITE_URL}/og-cover.jpg` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/rwanda` }],
  }),
  component: HubPage,
});

function HubPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-[1760px] px-6 py-10 lg:px-10">
        <h1 className="text-3xl font-bold sm:text-4xl">Property and vehicle guides for Rwanda</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Each guide below collects the live Ibyungura.com listings for one type of search — the same
          verified agent listings you'll find in the main directory, grouped so you can start where you
          already know you're looking.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LANDINGS.map((l) => (
            <Link
              key={l.slug}
              to="/rwanda/$slug"
              params={{ slug: l.slug }}
              className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-brand"
            >
              <h2 className="text-lg font-bold">{l.h1}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{l.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
