import Link from "next/link";
import { getPublicGeneralContents } from "@/lib/adapters/contentPublicAdapter";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ContentThumbnail } from "@/components/content/ContentThumbnail";
import { CONTENT_CATEGORY_LABELS_PUBLIC, CONTENT_CATEGORY_EMOJI } from "@/lib/content";

/**
 * Seção "Últimas reflexões" da Home — mesmo layout em carrossel de
 * `RecentContents`, mas só para conteúdo geral (sem livro associado,
 * `content_category !== "book"`): posts sobre hábito de leitura,
 * produtividade, bastidores do BookCringe etc. Renderiza `null` sem
 * conteúdo geral publicado — não afeta quem só usa o módulo Conteúdo no
 * modelo antigo (sempre vinculado a livro).
 */
export async function LatestReflections() {
  const contents = await getPublicGeneralContents(8);

  if (contents.length === 0) return null;

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-10">
          <SectionHeader
            eyebrow="Bastidores"
            title="Últimas reflexões"
            description="Hábitos de leitura, produtividade e os bastidores do BookCringe — sem depender de nenhum livro específico."
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
            const title = content.title || CONTENT_CATEGORY_LABELS_PUBLIC[content.content_category];
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
                    {CONTENT_CATEGORY_EMOJI[content.content_category]}{" "}
                    {CONTENT_CATEGORY_LABELS_PUBLIC[content.content_category]}
                  </Badge>
                  <h3 className="font-bold text-sm text-[var(--bc-ink)] leading-tight line-clamp-2">
                    {title}
                  </h3>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
