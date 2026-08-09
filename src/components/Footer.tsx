import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/byungura-logo.png.asset.json";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-secondary">
      <div className="mx-auto max-w-[1760px] px-6 pt-12 lg:px-10">
        {/* <img src={logoAsset.url} alt="byungura.com" className="h-12 w-auto object-contain" /> */}
        <img src= "/bungura_logo.png" alt="ibyungura.com" className="h-12 w-auto object-contain" />
      </div>
      <div className="mx-auto grid max-w-[1760px] gap-10 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div>
          <h4 className="mb-3 text-sm font-bold">Support</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Help Center</li>
            <li>Safety information</li>
            <li>Cancellation options</li>
            <li>Report a neighborhood concern</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">Community</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/agents" search={{ q: "", city: "", agency: "" }}>Find an agent</Link></li>
            <li>Become an agent</li>
            <li>Refer a friend</li>
            <li>Investor relations</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">Listings</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/properties">All properties</Link></li>
            <li>Featured homes</li>
            <li>New developments</li>
            <li>Commercial spaces</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">LoyalityReal250</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Newsroom</li>
            <li>New features</li>
            <li>Careers</li>
            <li>Contact us</li>
          </ul>
        </div> 
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1760px] flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row lg:px-10">
          <span>© {new Date().getFullYear()} LoyalityReal250 · Built with care</span>
          <span className="flex gap-4"><span>Privacy</span><span>Terms</span><span>Sitemap</span></span>
        </div>
      </div>
    </footer>
  );
}
