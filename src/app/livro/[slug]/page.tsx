import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBookDetail } from "@/lib/adapters/bookDetailPublicAdapter";
import { BookCover } from "@/components/book/BookCover";
import { BookCTA } from "@/components/book/BookCTA";
import { Rating } from "@/components/bookclub/Rating";
import { Badge } from "@/components/ui/Badge";
import { BookContentsSection } from "@/components/content/BookContentsSection";
import { AffiliateDisclosure } from "@/components/book/AffiliateDisclosure";
import { formatRating } from "@/lib/utils";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

// Página de detalhe de livro (novo — antes só existiam listagens). Mesma
// estratégia de revalidate das demais páginas públicas que leem do
// Supabase (src/app/page.tsx, src/app/biblioteca/page.tsx etc.).
export const revalidate = 3600;

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getPublicBookDetail(slug);

  if (!book) {
    return { title: "Livro não encontrado" };
  }

  const title = `${book.title} — ${book.author}`;
  const description =
    book.review?.slice(0, 160) ||
    `${book.title}, de ${book.author}, no BookCringe: nota, conteúdos e onde comprar.`;
  const url = `${SITE_URL}/livro/${slug}`;
  // `book.cover` pode ser um path relativo (/public) ou uma URL absoluta
  // (Amazon/Open Library etc.) — em ambos os casos o Next resolve contra
  // `metadataBase` (src/app/layout.tsx) para o OG. Sem capa, cai para o
  // mesmo fallback do layout raiz (`/logo.png`).
  const image = book.cover || "/logo.png";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "book",
      url,
      siteName: SITE_NAME,
      title,
      description,
      authors: [book.author],
      images: [{ url: image, width: 800, height: 1200, alt: `Capa do livro "${book.title}"` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const book = await getPublicBookDetail(slug);

  if (!book) {
    notFound();
  }

  return (
    <div className="pt-28 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-8">
          <div className="w-full max-w-[220px] mx-auto sm:mx-0">
            <BookCover title={book.title} cover={book.cover} width={220} height={308} priority />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--bc-ink)] tracking-tight leading-tight">
                {book.title}
              </h1>
              <p className="mt-1 text-lg text-[var(--bc-muted)]">{book.author}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {typeof book.rating === "number" && (
                <div className="flex items-center gap-2">
                  <Rating value={book.rating} />
                  <span className="text-sm font-semibold text-[var(--bc-ink)]">
                    {formatRating(book.rating)}
                  </span>
                </div>
              )}
              {book.favorite && <Badge variant="red">⭐ Favorito</Badge>}
              {book.wouldRecommend && <Badge variant="default">👍 Recomendo</Badge>}
              {typeof book.contentCount === "number" && book.contentCount > 0 && (
                <Badge variant="muted">
                  🎥 {book.contentCount} conteúdo{book.contentCount === 1 ? "" : "s"}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-[var(--bc-muted)]">
              {book.year && <span>{book.year}</span>}
              {book.pages && <span>{book.pages} páginas</span>}
              {book.country && <span>{book.country}</span>}
              {book.genre && book.genre.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {book.genre.map((g) => (
                    <Badge key={g} variant="muted">
                      {g}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {book.review && (
              <p className="text-[var(--bc-ink)] leading-relaxed max-w-2xl">{book.review}</p>
            )}

            {book.amazonUrl && (
              <div className="pt-1">
                <BookCTA amazonUrl={book.amazonUrl} size="md" />
              </div>
            )}
          </div>
        </div>

        <BookContentsSection contents={book.contents} />

        {book.amazonUrl && (
          <div className="pt-8">
            <AffiliateDisclosure />
          </div>
        )}
      </div>
    </div>
  );
}
