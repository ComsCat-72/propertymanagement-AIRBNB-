import { getUploadSignature, getSignupUploadSignature } from "./cloudinary.functions";

export type UploadedImage = { url: string; publicId: string };

const MAX_BYTES = 20 * 1024 * 1024;

export type ProgressFn = (percent: number) => void;

async function upload(
  file: Blob,
  filename: string,
  kind: "listing" | "avatar" | "signup",
  onProgress?: ProgressFn,
) {
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

  onProgress?.(0);
  const json = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Upload failed (${xhr.status}): ${String(xhr.responseText).slice(0, 200)}`));
        return;
      }
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        reject(new Error("Unexpected response from image service"));
      }
    };
    xhr.send(form);
  });
  onProgress?.(100);
  return { url: json.secure_url, publicId: json.public_id } satisfies UploadedImage;
}

export function uploadListingImage(file: File, onProgress?: ProgressFn) {
  return upload(file, file.name, "listing", onProgress);
}

export function uploadAvatar(blob: Blob, filename: string, onProgress?: ProgressFn) {
  return upload(blob, filename, "avatar", onProgress);
}

export function uploadSignupAvatar(blob: Blob, filename: string, onProgress?: ProgressFn) {
  return upload(blob, filename, "signup", onProgress);
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