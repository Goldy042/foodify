"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";

type CloudinaryDirectUploadFieldProps = {
  name: string;
  defaultValue?: string;
  helpText?: string;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function CloudinaryDirectUploadField({
  name,
  defaultValue = "",
  helpText = "Upload JPG, PNG, or WebP up to 5MB.",
}: CloudinaryDirectUploadFieldProps) {
  const [imageUrl, setImageUrl] = React.useState(defaultValue);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image is too large. Max size is 5MB.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/cloudinary/menu-upload", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const payload = (await response.json()) as { secure_url?: string };
      if (!payload.secure_url) {
        throw new Error("Upload failed");
      }

      setImageUrl(payload.secure_url);
    } catch {
      setError("Could not upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={imageUrl} />
      <Input type="file" accept="image/*" onChange={handleFileChange} />
      {uploading ? (
        <p className="text-xs text-muted-foreground">Uploading image...</p>
      ) : (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {imageUrl ? (
        <div className="h-24 w-full overflow-hidden rounded-md border border-border/70 bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Uploaded preview"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}
    </div>
  );
}
