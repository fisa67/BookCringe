import { ContentCard } from "@/components/content/ContentCard";
import { summarizeContentsByType } from "@/lib/content";
import type { PublicContentWithBook } from "@/lib/adapters/contentPublicAdapter";

interface BookContentsSectionProps {
  contents: PublicContentWithBook[];
}

/**
 * Estatística "Conteúdos sobre este livro: 2 reels, 1 short, 1 review" —
 * um item por `content_type` presente, mais frequente primeiro.
 */
function ContentStats({ contents }: { contents: PublicContentWithBook[] }) {
  const summary = summarizeContentsByType(contents);
  if (summary.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-sm text-[var(--bc-muted)]">
      {summary.map((item) => (
        <li key={item.contentType}>
          • {item.count} {item.label.toLowerCase()}
        </li>
      ))}
    </ul>
  );
}

/**
 * Seção "Conteúdos sobre este livro" da página `/livro/[slug]`. Com um
 * único conteúdo, vira um CTA destacado (espec explícita); com mais de
 * um, uma grade de `ContentCard`. Sem conteúdo, não renderiza nada — a
 * página decide se mostra a seção checando `contents.length > 0`. `id`
 * usado como âncora pelo CTA "▶ Assistir vídeo" dos cards de livro
 * (`WatchVideoCTA`, Biblioteca/Recomendações/Home).
 */
export function BookContentsSection({ contents }: BookContentsSectionProps) {
  if (contents.length === 0) return null;

  if (contents.length === 1) {
    const content = contents[0];
    return (
      <section id="conteudos" className="py-4">
        <h2 className="text-xl font-bold text-[var(--bc-ink)] mb-2">Conteúdos sobre este livro</h2>
        <ContentStats contents={contents} />
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center h-12 px-7 rounded-lg text-base font-medium gap-2 bg-[var(--bc-red)] text-white hover:bg-[var(--bc-red-dark)] transition-all duration-150 active:scale-[0.98]"
        >
          ▶ Assistir vídeo sobre este livro
        </a>
      </section>
    );
  }

  return (
    <section id="conteudos" className="py-4">
      <h2 className="text-xl font-bold text-[var(--bc-ink)] mb-2">Conteúdos sobre este livro</h2>
      <ContentStats contents={contents} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contents.map((content) => (
          <ContentCard key={content.id} content={content} />
        ))}
      </div>
    </section>
  );
}
