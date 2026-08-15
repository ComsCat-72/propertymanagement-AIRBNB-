import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyListings from "./tools/list-my-listings";
import createListing from "./tools/create-listing";
import updateListing from "./tools/update-listing";
import deleteListing from "./tools/delete-listing";
import searchProperties from "./tools/search-properties";
import getMyAccount from "./tools/my-account";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "loyality-home-hub",
  title: "Loyality Home Hub",
  version: "0.1.0",
  instructions:
    "Tools for Ibyungura.com, a Rwandan real estate and vehicle marketplace. Use `search_properties` to find active listings, `list_my_listings` / `create_listing` / `update_listing` / `delete_listing` to manage the signed-in agent's own listings, and `get_my_account` for plan, quota and verified badge status.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProperties, listMyListings, createListing, updateListing, deleteListing, getMyAccount],
});
