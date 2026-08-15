/** Server-only Cloudinary helpers (never imported by client code). */

async function sha1Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signParams(params: Record<string, string | number>, secret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return sha1Hex(`${toSign}${secret}`);
}

export function readCloudinaryEnv() {
  let cloudName = process.env["CLOUDINARY_CLOUD_NAME"];
  let apiKey = process.env["CLOUDINARY_API_KEY"];
  let apiSecret = process.env["CLOUDINARY_API_SECRET"];

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

/** Permanently removes assets from Cloudinary. Never throws — returns how many were deleted. */
export async function destroyAssets(publicIds: string[]) {
  const ids = publicIds.filter((v) => typeof v === "string" && v.length > 0);
  if (!ids.length) return 0;
  let cfg: ReturnType<typeof readCloudinaryEnv>;
  try {
    cfg = readCloudinaryEnv();
  } catch (err) {
    console.error("Cloudinary cleanup skipped:", err);
    return 0;
  }
  let deleted = 0;
  for (const publicId of ids) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = await signParams({ public_id: publicId, timestamp }, cfg.apiSecret);
      const body = new URLSearchParams({
        public_id: publicId,
        timestamp: String(timestamp),
        api_key: cfg.apiKey,
        signature,
      });
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`, {
        method: "POST",
        body,
      });
      if (res.ok) deleted += 1;
      else console.error("Cloudinary destroy failed", res.status, await res.text());
    } catch (err) {
      console.error("Cloudinary destroy error", err);
    }
  }
  return deleted;
}
