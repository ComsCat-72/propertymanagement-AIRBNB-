export function formatPrice(price: number, type: "sale" | "rent"): string {
  const n = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);
  return type === "rent" ? `${n}/mo` : n;
}

export function categoryLabel(c: string): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}