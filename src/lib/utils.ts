import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function formatRating(rating: number): string {
  return rating.toFixed(1).replace(".", ",");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Deve refletir `images.remotePatterns` em next.config.ts. Usado para decidir
// se um `cover_path` pode ser passado com segurança para next/image sem
// lançar erro em runtime (hostname não configurado). Paths relativos (/public)
// são sempre aceitos. Upload via Supabase Storage (fase futura) exigirá
// adicionar o hostname do projeto Supabase em ambas as listas.
const ALLOWED_COVER_HOSTNAMES = new Set([
  "covers.openlibrary.org",
  "images-na.ssl-images-amazon.com",
  "m.media-amazon.com",
  "images.amazon.com",
  "books.google.com",
]);

export function isDisplayableCoverPath(path?: string | null): boolean {
  if (!path) return false;
  if (path.startsWith("/")) return true;

  try {
    return ALLOWED_COVER_HOSTNAMES.has(new URL(path).hostname);
  } catch {
    return false;
  }
}
