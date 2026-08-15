import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

async function sha1Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(params: Record<string, string | number>, secret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return sha1Hex(`${toSign}${secret}`);
}

function readEnv() {
  let cloudName = process.env["CLOUDINARY_CLOUD_NAME"];
  let apiKey = process.env["CLOUDINARY_API_KEY"];
  let apiSecret = process.env["CLOUDINARY_API_SECRET"];

  // Fallback: standard `CLOUDINARY_URL` form — cloudinary://<api_key>:<api_secret>@<cloud_name>
  const url = process.env["CLOUDINARY_URL"];
  if (url && (!cloudName || !apiKey || !apiSecret)) {
    const match = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url.trim());
    if (match) {
      apiKey = apiKey || match[1];
      apiSecret = apiSecret || match[2];
      cloudName = cloudName || match[3];
    }
  }

  const missing = [
    !cloudName && "CLOUDINARY_CLOUD_NAME",
    !apiKey && "CLOUDINARY_API_KEY",
    !apiSecret && "CLOUDINARY_API_SECRET",
  ].filter(Boolean) as string[];

  if (missing.length) {
    throw new Error(
      `Image storage is not configured on this deployment — missing environment ${
        missing.length > 1 ? "variables" : "variable"
      }: ${missing.join(", ")}. Add ${missing.length > 1 ? "them" : "it"} to your hosting provider's environment settings (or set CLOUDINARY_URL) and redeploy.`,
    );
  }

  return { cloudName: cloudName!, apiKey: apiKey!, apiSecret: apiSecret! };
}

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
    const { cloudName, apiKey, apiSecret } = readEnv();
    const folder = `byungura/${data.kind === "listing" ? "listings" : "avatars"}/${context.userId}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await sign({ folder, timestamp }, apiSecret);
    return { cloudName, apiKey, timestamp, folder, signature };
  });

/** Signature for the sign-up form, before an account exists. Folder is fixed. */
export const getSignupUploadSignature = createServerFn({ method: "POST" }).handler(
  async (): Promise<SignedUpload> => {
    const { cloudName, apiKey, apiSecret } = readEnv();
    const folder = "byungura/avatars/signup";
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await sign({ folder, timestamp }, apiSecret);
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
    const { cloudName, apiKey, apiSecret } = readEnv();
    const mine = data.publicIds.filter((id) => id.includes(`/${context.userId}/`));
    let deleted = 0;
    for (const publicId of mine) {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = await sign({ public_id: publicId, timestamp }, apiSecret);
      const body = new URLSearchParams({
        public_id: publicId,
        timestamp: String(timestamp),
        api_key: apiKey,
        signature,
      });
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: "POST",
        body,
      });
      if (res.ok) deleted += 1;
      else console.error("Cloudinary destroy failed", res.status, await res.text());
    }
    return { deleted };
  });