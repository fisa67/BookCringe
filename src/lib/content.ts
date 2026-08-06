import type { CmsContentCategory, CmsContentPlatform, CmsContentType } from "@/lib/types/cms";

/**
 * Domínio público de "conteúdos" (reels, shorts, vídeos, carrosséis,
 * reviews) — labels e ícones para os cards em `/livro/[slug]`, `/conteudos`,
 * Home ("Últimos conteúdos"), Biblioteca e Recomendações. Isolado de
 * `src/lib/admin/contentLabels.ts` (mesmo padrão de `bookclub.ts` vs. os
 * labels do admin do Clube) — evita acoplar componentes públicos ao
 * domínio administrativo.
 */

export const PLATFORM_LABELS_PUBLIC: Record<CmsContentPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  spotify: "Spotify",
  podcast: "Podcast",
  blog: "Blog",
  website: "Site",
};

export const CONTENT_TYPE_LABELS_PUBLIC: Record<CmsContentType, string> = {
  reel: "Reel",
  short: "Short",
  video: "Vídeo",
  podcast: "Podcast",
  article: "Artigo",
  other: "Conteúdo",
  youtube: "Vídeo",
  carousel: "Carrossel",
  review: "Review",
};

/** Plural dos labels acima — usado na estatística "Conteúdos sobre este livro" (`/livro/[slug]`). */
export const CONTENT_TYPE_LABELS_PLURAL: Record<CmsContentType, string> = {
  reel: "Reels",
  short: "Shorts",
  video: "Vídeos",
  podcast: "Podcasts",
  article: "Artigos",
  other: "Conteúdos",
  youtube: "Vídeos",
  carousel: "Carrosséis",
  review: "Reviews",
};

/**
 * Tipos de conteúdo "com vídeo" — disparam o CTA visual mais forte
 * "▶ Assistir vídeo" nos cards de livro (Biblioteca/Recomendações/Home),
 * diferente de carrossel/review, que não têm player.
 */
export const VIDEO_CONTENT_TYPES: CmsContentType[] = ["reel", "short", "youtube", "video"];

export function isVideoContentType(contentType: CmsContentType): boolean {
  return VIDEO_CONTENT_TYPES.includes(contentType);
}

/** Emoji por tipo de conteúdo — usado nos badges/CTAs públicos. */
export const CONTENT_TYPE_EMOJI: Record<CmsContentType, string> = {
  reel: "🎥",
  short: "🎥",
  video: "🎥",
  youtube: "🎥",
  carousel: "🖼️",
  review: "📖",
  podcast: "🎧",
  article: "📄",
  other: "🎥",
};

/**
 * Filtros de `/conteudos` (Todos + um grupo por tipo). Content types que
 * mapeiam para o mesmo grupo visual (ex.: reel/short/video/youtube → tipos
 * "com vídeo") ficam sob o mesmo filtro para não fragmentar a navegação.
 */
export type ContentFilterKey = "all" | "reel" | "short" | "youtube" | "review" | "carousel";

export const CONTENT_FILTERS: Array<{ key: ContentFilterKey; label: string; types?: CmsContentType[] }> = [
  { key: "all", label: "Todos" },
  { key: "reel", label: "Reels", types: ["reel"] },
  { key: "short", label: "Shorts", types: ["short"] },
  { key: "youtube", label: "YouTube", types: ["youtube", "video"] },
  { key: "review", label: "Reviews", types: ["review", "article"] },
  { key: "carousel", label: "Carrosséis", types: ["carousel"] },
];

/**
 * Labels PT-BR de `content_category` (Fase 2 do módulo Conteúdo — conteúdo
 * geral, sem livro associado) para uso em componentes públicos.
 */
export const CONTENT_CATEGORY_LABELS_PUBLIC: Record<CmsContentCategory, string> = {
  book: "Livro",
  reading: "Leitura",
  productivity: "Produtividade",
  community: "Comunidade",
  opinion: "Opinião",
  other: "Geral",
};

/** Emoji por categoria — usado no badge que substitui a capa/nome do livro quando não há livro associado. */
export const CONTENT_CATEGORY_EMOJI: Record<CmsContentCategory, string> = {
  book: "📚",
  reading: "📖",
  productivity: "⚡",
  community: "👥",
  opinion: "💬",
  other: "🔖",
};

/**
 * Filtro por `content_category` em `/conteudos` — combinável com
 * `CONTENT_FILTERS` (tipo). "Livros" agrupa apenas `content_category ===
 * "book"`; as demais opções espelham as categorias gerais pedidas.
 */
export type ContentCategoryFilterKey = "all" | "book" | "reading" | "productivity" | "community" | "opinion";

export const CONTENT_CATEGORY_FILTERS: Array<{ key: ContentCategoryFilterKey; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "book", label: "Livros" },
  { key: "reading", label: "Leitura" },
  { key: "productivity", label: "Produtividade" },
  { key: "community", label: "Comunidade" },
  { key: "opinion", label: "Opinião" },
];

export interface ContentTypeSummaryItem {
  contentType: CmsContentType;
  label: string;
  count: number;
}

/**
 * Agrupa conteúdos por `content_type` com contagem — estatística "Conteúdos
 * sobre este livro: 2 reels, 1 short, 1 review" da página `/livro/[slug]`.
 * Ordenado por contagem desc (mais frequente primeiro); tipos ausentes no
 * livro simplesmente não aparecem.
 */
export function summarizeContentsByType(
  contents: ReadonlyArray<{ content_type: CmsContentType }>
): ContentTypeSummaryItem[] {
  const counts = new Map<CmsContentType, number>();
  for (const content of contents) {
    counts.set(content.content_type, (counts.get(content.content_type) ?? 0) + 1);
  }

  return Array.from(counts, ([contentType, count]) => ({
    contentType,
    label: count === 1 ? CONTENT_TYPE_LABELS_PUBLIC[contentType] : CONTENT_TYPE_LABELS_PLURAL[contentType],
    count,
  })).sort((a, b) => b.count - a.count);
}

/**
 * Um conteúdo é público quando `published_at` existe e não está no futuro
 * — mesma regra de `getContentStatus` (`src/lib/admin/contentLabels.ts`),
 * duplicada aqui de propósito para não importar o domínio admin de
 * componentes/adapters públicos.
 */
export function isContentPublished(publishedAt: string | null | undefined, now: Date = new Date()): boolean {
  if (!publishedAt) return false;
  const publishedDate = new Date(publishedAt);
  if (Number.isNaN(publishedDate.getTime())) return false;
  return publishedDate.getTime() <= now.getTime();
}

/**
 * Normaliza `thumbnail_path` do CMS antes de renderizar em `<img>`. O campo
 * aceita URL absoluta (CDN do Instagram/TikTok/YouTube) ou path relativo
 * (`/public`). Valores em branco, inválidos ou só com espaços viram
 * `undefined` para acionar o fallback visual — evita `<img src="">` ou links
 * quebrados sem tratamento.
 */
export function resolveThumbnailPath(path?: string | null): string | undefined {
  if (!path) return undefined;

  const trimmed = path.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return trimmed;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
