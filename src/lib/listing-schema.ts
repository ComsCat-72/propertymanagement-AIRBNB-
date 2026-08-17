export type FieldType = "text" | "number" | "select" | "boolean";

export interface AttributeField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  suffix?: string;
  placeholder?: string;
}

export type ListingCategory =
  | "house" | "apartment" | "villa" | "land" | "commercial" | "car" | "motorcycle";

const CONDITION = ["New", "Excellent", "Good", "Needs work"];

const BUILDING: AttributeField[] = [
  { key: "plot_size_sqm", label: "Plot size", type: "number", suffix: "m²" },
  { key: "floors", label: "Floors", type: "number" },
  { key: "parking", label: "Parking spaces", type: "number" },
  { key: "year_built", label: "Year built", type: "number", placeholder: "2021" },
  { key: "furnished", label: "Furnished", type: "select", options: ["Unfurnished", "Semi-furnished", "Fully furnished"] },
  { key: "condition", label: "Condition", type: "select", options: CONDITION },
];

const LAND: AttributeField[] = [
  { key: "land_size_sqm", label: "Land size", type: "number", suffix: "m²" },
  { key: "land_use", label: "Land use", type: "select", options: ["Residential", "Commercial", "Agricultural", "Mixed use"] },
  { key: "title_deed", label: "Title deed available", type: "boolean" },
  { key: "road_access", label: "Road access", type: "select", options: ["Tarmac", "Murram", "Footpath only"] },
  { key: "utilities", label: "Utilities on site", type: "select", options: ["Water & electricity", "Water only", "Electricity only", "None"] },
  { key: "fenced", label: "Fenced", type: "boolean" },
];

const COMMERCIAL: AttributeField[] = [
  { key: "floor_area_sqm", label: "Floor area", type: "number", suffix: "m²" },
  { key: "floors", label: "Floors", type: "number" },
  { key: "parking", label: "Parking spaces", type: "number" },
  { key: "use_type", label: "Best used as", type: "text", placeholder: "Office, shop, warehouse…" },
  { key: "condition", label: "Condition", type: "select", options: CONDITION },
];

const VEHICLE: AttributeField[] = [
  { key: "make", label: "Make", type: "text", placeholder: "Toyota" },
  { key: "model", label: "Model", type: "text", placeholder: "RAV4" },
  { key: "year", label: "Year", type: "number", placeholder: "2018" },
  { key: "mileage_km", label: "Mileage", type: "number", suffix: "km" },
  { key: "transmission", label: "Transmission", type: "select", options: ["Automatic", "Manual"] },
  { key: "fuel", label: "Fuel", type: "select", options: ["Petrol", "Diesel", "Hybrid", "Electric"] },
  { key: "engine_cc", label: "Engine", type: "number", suffix: "cc" },
  { key: "color", label: "Colour", type: "text" },
  { key: "condition", label: "Condition", type: "select", options: CONDITION },
  { key: "registered", label: "Registered in Rwanda", type: "boolean" },
];

export const CATEGORY_FIELDS: Record<ListingCategory, AttributeField[]> = {
  house: BUILDING,
  apartment: BUILDING,
  villa: BUILDING,
  land: LAND,
  commercial: COMMERCIAL,
  car: VEHICLE,
  motorcycle: VEHICLE,
};

/** Categories where bedrooms / bathrooms / area make sense. */
export const ROOM_CATEGORIES: ListingCategory[] = ["house", "apartment", "villa"];

export function hasRooms(category: string) {
  return ROOM_CATEGORIES.includes(category as ListingCategory);
}

export function fieldsFor(category: string): AttributeField[] {
  return CATEGORY_FIELDS[category as ListingCategory] ?? BUILDING;
}

export type Attributes = Record<string, string | number | boolean>;

/** Turn stored attributes into label/value pairs for display. */
export function describeAttributes(category: string, attributes: unknown): { label: string; value: string }[] {
  const a = (attributes && typeof attributes === "object" ? attributes : {}) as Attributes;
  return fieldsFor(category)
    .map((f) => {
      const raw = a[f.key];
      if (raw === undefined || raw === null || raw === "") return null;
      const value =
        f.type === "boolean"
          ? raw ? "Yes" : "No"
          : f.type === "number"
            ? `${Number(raw).toLocaleString()}${f.suffix ? ` ${f.suffix}` : ""}`
            : String(raw);
      return { label: f.label, value };
    })
    .filter(Boolean) as { label: string; value: string }[];
}

export const MIN_PHOTOS = 3;

export const PHOTO_CHECKLIST = [
  "Shoot in daylight — open curtains, turn lights on",
  "Hold the phone horizontally and keep it steady",
  "Cover the outside, the main room and one detail shot",
  "Tidy up first: no clutter, no people, no number plates",
  "Use the real property — never stock or borrowed photos",
];

export const RWANDA_PROVINCES = ["Kigali City", "Northern", "Southern", "Eastern", "Western"];

export const SPECIALIZATIONS = [
  "Residential sales",
  "Rentals",
  "Land",
  "Commercial",
  "Luxury homes",
  "Vehicles",
  "Property management",
  "Diaspora clients",
];

/** Quick-pick amenity suggestions per category — agents can still type their own. */
export const AMENITY_SUGGESTIONS: Record<ListingCategory, string[]> = {
  house: ["Water tank", "Backup generator", "Solar power", "Security fence", "Garden", "Garage", "Borehole", "CCTV"],
  apartment: ["Lift", "Backup generator", "Water tank", "Parking bay", "Balcony", "Security guard", "Gym", "Wi-Fi ready"],
  villa: ["Swimming pool", "Garden", "Servant quarters", "Security fence", "Solar power", "Garage", "CCTV", "Backup generator"],
  land: ["Fenced", "Water connection", "Electricity nearby", "Tarmac access", "Survey done", "Corner plot"],
  commercial: ["Backup generator", "Lift", "Parking", "Air conditioning", "Loading bay", "CCTV", "Fibre internet"],
  car: ["Air conditioning", "Reverse camera", "Alloy wheels", "Leather seats", "Sunroof", "Bluetooth", "New tyres"],
  motorcycle: ["Helmet included", "Crash bars", "New tyres", "Top box", "Electric start"],
};

export function amenitySuggestions(category: string): string[] {
  return AMENITY_SUGGESTIONS[category as ListingCategory] ?? AMENITY_SUGGESTIONS.house;
}
