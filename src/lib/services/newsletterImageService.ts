import { randomUUID } from "node:crypto";
import { supabaseAdminClient } from "@/lib/supabase/client";

export const NEWSLETTER_IMAGE_BUCKET = "newsletter-images";
export const NEWSLETTER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const IMAGE_TYPES = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 },
  "image/png": {
    extension: "png",
    signature: (bytes: Uint8Array) =>
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  },
  "image/webp": {
    extension: "webp",
    signature: (bytes: Uint8Array) =>
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50,
  },
} as const;

type SupportedImageMime = keyof typeof IMAGE_TYPES;

export type UploadNewsletterImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

async function detectImageMime(file: File): Promise<SupportedImageMime | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  for (const [mime, definition] of Object.entries(IMAGE_TYPES) as [
    SupportedImageMime,
    (typeof IMAGE_TYPES)[SupportedImageMime],
  ][]) {
    if (definition.signature(bytes)) return mime;
  }

  return null;
}

export async function uploadNewsletterImage(file: File): Promise<UploadNewsletterImageResult> {
  if (!file || file.size === 0) {
    return { ok: false, error: "Selecione uma imagem para enviar." };
  }

  if (file.size > NEWSLETTER_IMAGE_MAX_BYTES) {
    return { ok: false, error: "A imagem deve ter no máximo 5 MB." };
  }

  if (!(file.type in IMAGE_TYPES)) {
    return { ok: false, error: "Formato não permitido. Use JPG, PNG ou WebP." };
  }

  const detectedMime = await detectImageMime(file);
  if (!detectedMime || detectedMime !== file.type) {
    return { ok: false, error: "O arquivo não corresponde a uma imagem válida." };
  }

  const extension = IMAGE_TYPES[detectedMime].extension;
  const path = `campaigns/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const { error } = await supabaseAdminClient.storage.from(NEWSLETTER_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: detectedMime,
    upsert: false,
  });

  if (error) {
    console.error("[newsletterImageService] uploadNewsletterImage error", error);
    if (/bucket|not found|does not exist/i.test(error.message)) {
      return {
        ok: false,
        error: "O bucket newsletter-images não está disponível. Execute a migration de imagens e tente novamente.",
      };
    }
    return { ok: false, error: "Não foi possível enviar a imagem. Tente novamente." };
  }

  const { data } = supabaseAdminClient.storage.from(NEWSLETTER_IMAGE_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
