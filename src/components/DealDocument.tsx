import type { ReactNode } from "react";
import { Printer } from "lucide-react";
import logo from "@/assets/ibyungura-logo.png";

/** Shared A4-style frame for the printable deal certificate and invoice. */
export function DealDocument({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="min-h-screen bg-muted/40 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-[820px] px-4 print:px-0">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <h1 className="text-lg font-bold">{title}</h1>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground"
          >
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </button>
        </div>
        <div className="rounded-3xl border border-border bg-card p-10 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DocHeader({ right }: { right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border pb-6">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Ibyungura.com" className="h-10 w-auto" />
        <div>
          <p className="text-lg font-bold">Ibyungura.com</p>
          <p className="text-xs text-muted-foreground">Rwanda property & vehicle marketplace</p>
        </div>
      </div>
      {right && <div className="text-right text-sm">{right}</div>}
    </div>
  );
}

export function DocRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b border-dashed border-border py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
