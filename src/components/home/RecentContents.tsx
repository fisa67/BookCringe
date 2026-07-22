import Link from "next/link";
import { getPublicRecentContents, getPublicContentsCount } from "@/lib/adapters/contentPublicAdapter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ContentThumbnail } from "@/components/content/ContentThumbnail";
import { CONTENT_TYPE_LABELS_PUBLIC, CONTENT_TYPE_EMOJI } from "@/lib/content";

/**
 * Seção "Últimos conteúdos" da Home — carrossel horizontal (estilo
 * Netflix, `overflow-x-auto` com scroll-snap, sem JS) com os conteúdos
 * mais recentes publicados, de qualquer livro.
 */
export async function RecentContents() {
  const [contents, totalCount] = await Promise.all([
    getPublicRecentContents(8),
    getPublicContentsCount(),
  ]);

  if (contents.length === 0) return null;

  return (
    <section className="py-20 px-6 bg-[var(--bc-surface)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-10">
          <SectionHeader
            eyebrow="Conteúdo"
            title="Últimos conteúdos"
            description={`${totalCount} conteúdo${totalCount === 1 ? "" : "s"} publicado${totalCount === 1 ? "" : "s"} sobre os livros do BookCringe.`}
            className="mb-0"
          />
          <Link href="/conteudos" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Ver todos →
            </Button>
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory -mx-6 px-6 sm:mx-0 sm:px-0">
          {contents.map((content) => {
            const title = content.title || content.book.title;
            return (
              <a
                key={content.id}
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group shrink-0 w-56 snap-start rounded-xl border border-[var(--bc-border)] bg-white overflow-hidden hover:border-[var(--bc-ink)]/20 hover:-translate-y-0.5 transition-all duration-200"
              >
                <ContentThumbnail
                  thumbnailPath={content.thumbnail_path}
                  title={title}
                  contentType={content.content_type}
                  className="aspect-video"
                />
                <div className="p-3 flex flex-col gap-1.5">
                  <Badge variant="muted" className="self-start">
                    {CONTENT_TYPE_EMOJI[content.content_type]} {CONTENT_TYPE_LABELS_PUBLIC[content.content_type]}
                  </Badge>
                  <h3 className="font-bold text-sm text-[var(--bc-ink)] leading-tight line-clamp-2">
                    {title}
                  </h3>
                  <p className="text-xs text-[var(--bc-muted)] line-clamp-1">
                    {content.book.title} — {content.book.author}
                  </p>
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link href="/conteudos">
            <Button variant="outline" size="sm">
              Ver todos os conteúdos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
