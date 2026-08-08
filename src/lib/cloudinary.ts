import { getUploadSignature, getSignupUploadSignature } from "./cloudinary.functions";

export type UploadedImage = { url: string; publicId: string };

const MAX_BYTES = 20 * 1024 * 1024;

async function upload(file: Blob, filename: string, kind: "listing" | "avatar" | "signup") {
  if (file.size > MAX_BYTES) throw new Error("Image must be under 20MB");

  const sig =
    kind === "signup"
      ? await getSignupUploadSignature()
      : await getUploadSignature({ data: { kind } });

  const form = new FormData();
  form.append("file", file, filename);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { secure_url: string; public_id: string };
  return { url: json.secure_url, publicId: json.public_id } satisfies UploadedImage;
}

export function uploadListingImage(file: File) {
  return upload(file, file.name, "listing");
}

export function uploadAvatar(blob: Blob, filename: string) {
  return upload(blob, filename, "avatar");
}

export function uploadSignupAvatar(blob: Blob, filename: string) {
  return upload(blob, filename, "signup");
}

/**
 * Requests a resized, auto-format/auto-quality version of a Cloudinary image.
 * Non-Cloudinary URLs (older Supabase Storage links) are returned untouched.
 */
export function cldUrl(url: string | undefined | null, width: number): string {
  if (!url) return "";
  const marker = "/image/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
  const [head, tail] = url.split(marker);
  return `${head}${marker}f_auto,q_auto,w_${width},c_limit/${tail}`;
}