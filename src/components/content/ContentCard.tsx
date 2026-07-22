import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ContentThumbnail } from "@/components/content/ContentThumbnail";
import { CONTENT_TYPE_LABELS_PUBLIC, PLATFORM_LABELS_PUBLIC, CONTENT_TYPE_EMOJI } from "@/lib/content";
import type { PublicContentWithBook } from "@/lib/adapters/contentPublicAdapter";

function formatPublishedDate(publishedAt?: string): string | undefined {
  if (!publishedAt) return undefined;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("pt-BR");
}

interface ContentCardProps {
  content: PublicContentWithBook;
  /** Mostra título + link do livro relacionado — usado em `/conteudos` e na Home. Omitido em `/livro/[slug]` (contexto já é o livro). */
  showBook?: boolean;
}

/**
 * Card de conteúdo público — thumbnail, plataforma, tipo, data e botão
 * "Assistir" (link externo). Usado em `/livro/[slug]` ("Conteúdos sobre
 * este livro"), `/conteudos` e na Home ("Últimos conteúdos").
 */
export function ContentCard({ content, showBook = false }: ContentCardProps) {
  const title = content.title || content.book.title;
  const publishedLabel = formatPublishedDate(content.published_at);

  return (
    <div className="group flex flex-col rounded-xl border border-[var(--bc-border)] bg-white overflow-hidden hover:border-[var(--bc-ink)]/20 hover:-translate-y-0.5 transition-all duration-200">
      <ContentThumbnail
        thumbnailPath={content.thumbnail_path}
        title={title}
        contentType={content.content_type}
      />

      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="default">{PLATFORM_LABELS_PUBLIC[content.platform]}</Badge>
          <Badge variant="muted">
            {CONTENT_TYPE_EMOJI[content.content_type]} {CONTENT_TYPE_LABELS_PUBLIC[content.content_type]}
          </Badge>
          {content.is_featured && <Badge variant="red">Destaque</Badge>}
        </div>

        <h3 className="font-bold text-sm text-[var(--bc-ink)] leading-tight line-clamp-2">{title}</h3>

        {showBook && (
          <Link
            href={`/livro/${content.book.slug}`}
            className="text-xs text-[var(--bc-muted)] hover:text-[var(--bc-red)] hover:underline line-clamp-1"
          >
            {content.book.title} — {content.book.author}
          </Link>
        )}

        {publishedLabel && <p className="text-xs text-[var(--bc-muted)]">{publishedLabel}</p>}

        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto pt-2 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-[var(--bc-ink)] text-white hover:bg-[var(--bc-ink)]/80 transition-all duration-150 active:scale-[0.97]"
        >
          ▶ Assistir
        </a>
      </div>
    </div>
  );
}
