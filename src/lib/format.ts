// export function formatPrice(price: number, type: "sale" | "rent"): string {
//   const n = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);
//   return type === "rent" ? `${n}/mo` : n;
// }

// export function categoryLabel(c: string): string {
//   return c.charAt(0).toUpperCase() + c.slice(1);
// }

export function formatPrice(price: number, type: "sale" | "rent"): string {
  const n = new Intl.NumberFormat("rw-RW", { 
    style: "currency", 
    currency: "RWF", 
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(price);
  
  return type === "rent" ? `${n}/mo` : n;
}

export function categoryLabel(c: string): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}