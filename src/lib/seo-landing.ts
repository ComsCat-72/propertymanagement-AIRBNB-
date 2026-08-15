/** High-intent SEO landing pages. Each maps a search query to a filtered listing view. */
export interface LandingFilters {
  type?: "sale" | "rent";
  category?: string;
  city?: string;
}

export interface Landing {
  slug: string;
  title: string;      // <title>, keep under 60 chars
  h1: string;
  description: string; // meta description, under 160 chars
  intro: string;
  filters: LandingFilters;
}

export const LANDINGS: Landing[] = [
  {
    slug: "houses-for-sale-in-kigali",
    title: "Houses for Sale in Kigali | Ibyungura.com",
    h1: "Houses for sale in Kigali",
    description:
      "Browse houses for sale in Kigali with prices in RWF, photos and direct WhatsApp contact to the listing agent on Ibyungura.com.",
    intro:
      "Every house below is an active Kigali sale listing published by a registered Ibyungura.com agent. Prices are shown in Rwandan francs, and you can call or message the agent directly — there is no middleman fee.",
    filters: { type: "sale", category: "house", city: "Kigali" },
  },
  {
    slug: "houses-for-rent-in-kigali",
    title: "Houses for Rent in Kigali | Ibyungura.com",
    h1: "Houses for rent in Kigali",
    description:
      "Find houses for rent in Kigali by monthly price in RWF, bedrooms and neighbourhood, with direct contact to the agent handling the property.",
    intro:
      "These are currently available rental houses in Kigali. Use the monthly rent, bedroom count and neighbourhood shown on each card to shortlist, then message the agent on WhatsApp to arrange a viewing.",
    filters: { type: "rent", category: "house", city: "Kigali" },
  },
  {
    slug: "apartments-for-rent-in-kigali",
    title: "Apartments for Rent in Kigali | Ibyungura.com",
    h1: "Apartments for rent in Kigali",
    description:
      "Serviced and unfurnished apartments for rent in Kigali, listed with monthly RWF rent, photos, bedrooms and the agent's direct contact.",
    intro:
      "Apartment rentals across Kigali, from studios to multi-bedroom units. Each listing shows the monthly rent in RWF, the number of bedrooms and bathrooms, and who to contact.",
    filters: { type: "rent", category: "apartment", city: "Kigali" },
  },
  {
    slug: "land-for-sale-in-rwanda",
    title: "Land for Sale in Rwanda | Ibyungura.com",
    h1: "Land for sale in Rwanda",
    description:
      "Plots of land for sale across Rwanda with size in square metres, asking price in RWF and the agent's phone and WhatsApp details.",
    intro:
      "Residential and commercial plots listed by agents across Rwanda. Each plot shows its size in square metres and location so you can compare price per square metre before contacting the agent.",
    filters: { type: "sale", category: "land" },
  },
  {
    slug: "commercial-property-for-rent-in-kigali",
    title: "Commercial Property for Rent in Kigali | Ibyungura.com",
    h1: "Commercial property for rent in Kigali",
    description:
      "Offices, shops and warehouses for rent in Kigali with monthly RWF rent, floor area and direct contact to the letting agent.",
    intro:
      "Office space, retail units and warehouses available to let in Kigali. Compare floor area and monthly rent, then contact the letting agent directly.",
    filters: { type: "rent", category: "commercial", city: "Kigali" },
  },
  {
    slug: "cars-for-sale-in-rwanda",
    title: "Cars for Sale in Rwanda | Ibyungura.com",
    h1: "Cars for sale in Rwanda",
    description:
      "Used and new cars for sale in Rwanda, listed with asking price in RWF, photos and the seller's WhatsApp and phone number.",
    intro:
      "Vehicles listed for sale by agents and dealers across Rwanda. Prices are in Rwandan francs and every listing links straight to the seller.",
    filters: { type: "sale", category: "car" },
  },
];

export const getLanding = (slug: string) => LANDINGS.find((l) => l.slug === slug);
