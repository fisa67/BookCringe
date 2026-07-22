import type { CmsContentPlatform, CmsContentType } from "@/lib/types/cms";

/**
 * Labels PT-BR para as duas categorias de conteúdo já existentes no schema
 * (`platform` e `content_type`) — isolado do domínio público, assim como
 * `bookclubLabels.ts`.
 */
export const PLATFORM_LABELS: Record<CmsContentPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  spotify: "Spotify",
  podcast: "Podcast",
  blog: "Blog",
  website: "Site",
};

export const CONTENT_TYPE_LABELS: Record<CmsContentType, string> = {
  reel: "Reel",
  short: "Short",
  video: "Vídeo",
  podcast: "Podcast",
  article: "Artigo",
  other: "Outro",
  youtube: "Vídeo (YouTube)",
  carousel: "Carrossel",
  review: "Review",
};

export type ContentStatus = "draft" | "scheduled" | "published";

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
};

/**
 * A tabela `contents` não tem uma coluna de status — deriva-se de
 * `published_at`: sem data é rascunho, data futura é agendado, data no
 * passado (ou presente) é publicado.
 */
export function getContentStatus(publishedAt: string | null | undefined, now: Date = new Date()): ContentStatus {
  if (!publishedAt) {
    return "draft";
  }

  const publishedDate = new Date(publishedAt);
  if (Number.isNaN(publishedDate.getTime())) {
    return "draft";
  }

  return publishedDate.getTime() > now.getTime() ? "scheduled" : "published";
}
