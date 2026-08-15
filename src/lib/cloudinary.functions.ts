import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

/** Signature for signed-in agents: listing images or profile photos. */
export const getUploadSignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { kind: "listing" | "avatar" }) => {
    if (input?.kind !== "listing" && input?.kind !== "avatar") {
      throw new Error("Invalid upload kind");
    }
    return { kind: input.kind };
  })
  .handler(async ({ data, context }): Promise<SignedUpload> => {
    const { readCloudinaryEnv, signParams } = await import("./cloudinary.server");
    const { cloudName, apiKey, apiSecret } = readCloudinaryEnv();
    const folder = `byungura/${data.kind === "listing" ? "listings" : "avatars"}/${context.userId}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await signParams({ folder, timestamp }, apiSecret);
    return { cloudName, apiKey, timestamp, folder, signature };
  });

/** Signature for the sign-up form, before an account exists. Folder is fixed. */
export const getSignupUploadSignature = createServerFn({ method: "POST" }).handler(
  async (): Promise<SignedUpload> => {
    const { readCloudinaryEnv, signParams } = await import("./cloudinary.server");
    const { cloudName, apiKey, apiSecret } = readCloudinaryEnv();
    const folder = "byungura/avatars/signup";
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await signParams({ folder, timestamp }, apiSecret);
    return { cloudName, apiKey, timestamp, folder, signature };
  },
);

/** Deletes assets the signed-in agent owns (folder is namespaced by user id). */
export const deleteUploads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { publicIds: string[] }) => {
    const ids = (input?.publicIds ?? []).filter((v) => typeof v === "string" && v.length > 0);
    if (ids.length > 50) throw new Error("Too many assets");
    return { publicIds: ids };
  })
  .handler(async ({ data, context }) => {
    const { destroyAssets } = await import("./cloudinary.server");
    const mine = data.publicIds.filter((id) => id.includes(`/${context.userId}/`));
    return { deleted: await destroyAssets(mine) };
  });

/**
 * Deletes a property row and every image it stored on Cloudinary.
 * Owners and admins only — enforced by RLS on the delete.
 */
export const deletePropertyWithImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id || typeof input.id !== "string") throw new Error("Missing listing id");
    return { id: input.id };
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row, error: readErr } = await supabase
      .from("properties")
      .select("id, image_public_ids")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Listing not found");

    const { data: deletedRow, error: delErr } = await supabase
      .from("properties")
      .delete()
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (delErr) throw new Error(delErr.message);
    if (!deletedRow) throw new Error("You don't have permission to delete this listing");

    const { destroyAssets } = await import("./cloudinary.server");
    const deleted = await destroyAssets((row.image_public_ids as string[] | null) ?? []);
    return { id: data.id, imagesDeleted: deleted };
  });
