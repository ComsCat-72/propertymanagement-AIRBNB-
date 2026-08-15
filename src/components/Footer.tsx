import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";
import logoUrl from "@/assets/ibyungura-logo.png";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary">
      <div className="mx-auto grid max-w-[1760px] gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div className="sm:col-span-2 lg:col-span-1">
          <img src={logoUrl} alt="Ibyungura.com — dreams into reality" width={990} height={280} loading="lazy" className="h-14 w-auto object-contain" />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Houses, land, commercial space and vehicles for sale or rent across Rwanda — listed by trusted local agents.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">Browse</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/properties" className="hover:text-foreground">All listings</Link></li>
            <li><Link to="/properties" search={{ type: "sale" } as never} className="hover:text-foreground">For sale</Link></li>
            <li><Link to="/properties" search={{ type: "rent" } as never} className="hover:text-foreground">For rent</Link></li>
            <li><Link to="/properties" search={{ category: "land" } as never} className="hover:text-foreground">Land</Link></li>
            <li><Link to="/properties" search={{ category: "car" } as never} className="hover:text-foreground">Vehicles</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">Agents</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/agents" search={{ q: "", city: "", agency: "" }} className="hover:text-foreground">Find an agent</Link></li>
            <li><Link to="/register" className="hover:text-foreground">Become an agent</Link></li>
            <li><Link to="/login" search={{ next: undefined }} className="hover:text-foreground">Agent log in</Link></li>
            <li><Link to="/dashboard/billing" className="hover:text-foreground">Plans & pricing</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="https://wa.me/250788000000" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground">
                <MessageCircle className="h-4 w-4" /> WhatsApp us
              </a>
            </li>
            <li>
              <a href="mailto:info@ibyungura.com" className="inline-flex items-center gap-2 hover:text-foreground">
                <Mail className="h-4 w-4" /> info@ibyungura.com
              </a>
            </li>
            <li><a href="/sitemap.xml" className="hover:text-foreground">Sitemap</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1760px] flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row lg:px-10">
          <span>© {new Date().getFullYear()} Ibyungura.com · Dreams into reality</span>
          <span>Kigali, Rwanda</span>
        </div>
      </div>
    </footer>
  );
}
