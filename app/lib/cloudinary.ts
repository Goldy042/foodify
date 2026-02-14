import "server-only";

import { createHash } from "node:crypto";

const DEFAULT_MENU_FOLDER = "foodify/menu-items";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function getRequiredEnv(name: "CLOUDINARY_CLOUD_NAME" | "CLOUDINARY_API_KEY" | "CLOUDINARY_API_SECRET") {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required Cloudinary env var: ${name}`);
  }
  return value.trim();
}

function buildSignature(params: Record<string, string>, apiSecret: string) {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const toSign = `${sorted.map(([key, value]) => `${key}=${value}`).join("&")}${apiSecret}`;
  return createHash("sha1").update(toSign).digest("hex");
}

export async function uploadMenuImageToCloudinary(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid image file type.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image file is too large.");
  }

  const cloudName = getRequiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = getRequiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = getRequiredEnv("CLOUDINARY_API_SECRET");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signatureParams = {
    folder: DEFAULT_MENU_FOLDER,
    timestamp,
  };

  const signature = buildSignature(signatureParams, apiSecret);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", DEFAULT_MENU_FOLDER);
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!response.ok) {
    throw new Error("Cloudinary upload failed.");
  }

  const payload = (await response.json()) as {
    secure_url?: string;
  };

  if (!payload.secure_url) {
    throw new Error("Cloudinary response did not include a secure URL.");
  }

  return payload.secure_url;
}

