import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { BookCard } from "@/components/book/BookCard";
import { CuratedStats } from "@/components/book/CuratedStats";
import { MonthlyRecommendation } from "@/components/book/MonthlyRecommendation";
import { AffiliateDisclosure } from "@/components/book/AffiliateDisclosure";
import { NewsletterCTA } from "@/components/forms/NewsletterCTA";
import {
  getPublicRecommendedBooks,
  getPublicRecommendationOfMonth,
} from "@/lib/adapters/recommendationsPublicAdapter";

export const metadata: Metadata = {
  title: "Recomendações",
  description:
    "Curadoria BookCringe: os livros que mais recomendo, selecionados por impacto, aprendizado, reflexão e relevância — não por nota.",
};

// Mesma estratégia de revalidate de /biblioteca, /clube-de-leitura e /estatisticas.
export const revalidate = 3600;

export default async function RecomendacoesPage() {
  const [books, monthlyPick] = await Promise.all([
    getPublicRecommendedBooks(),
    getPublicRecommendationOfMonth(),
  ]);

  // Métricas da barra do hero — só sobre os livros já filtrados pela
  // curadoria (favorite/would_recommend), nunca sobre a Biblioteca inteira.
  const booksCount = books.length;
  const ratings = books
    .map((book) => book.rating)
    .filter((rating): rating is number => typeof rating === "number");
  const avgRating =
    ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : undefined;
  const totalContents = books.reduce((sum, book) => sum + (book.contentCount ?? 0), 0);
  const genresCount = new Set(books.flatMap((book) => book.genre ?? [])).size;

  return (
    <>
      {/* Copy pensada para diferenciar esta página de /biblioteca (todas as
          leituras): aqui é curadoria pessoal (favorito/recomendaria), não
          ranking por nota — reforçado no subtítulo e nos 3 parágrafos da
          descrição. */}
      <PageHero
        badge="📚 Livros escolhidos a dedo."
        eyebrow="Recomendações"
        title="Curadoria BookCringe"
        subtitle="Os livros que mais recomendo."
        description={
          <>
            <p>
              Entre todas as leituras da minha biblioteca, estes são os livros que eu colocaria
              nas mãos de alguém sem pensar duas vezes.
            </p>
            <p>
              Não é um ranking de notas. É uma seleção baseada em impacto, aprendizado, reflexão e
              relevância.
            </p>
            <p className="font-medium text-[var(--bc-ink)]">
              📚 Apenas os livros que realmente ganharam seu lugar na minha estante essencial.
            </p>
          </>
        }
      >
        {booksCount > 0 && (
          <CuratedStats
            booksCount={booksCount}
            avgRating={avgRating}
            totalContents={totalContents}
            genresCount={genresCount}
          />
        )}
      </PageHero>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {monthlyPick && <MonthlyRecommendation book={monthlyPick} />}

          {books.length === 0 ? (
            <p className="text-sm text-[var(--bc-muted)]">Nenhuma recomendação publicada ainda.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {books.map((book) => (
                <BookCard key={book.id} book={book}>
                  <div className="flex flex-wrap gap-1.5">
                    {book.favorite && <Badge variant="red">Favorito</Badge>}
                    {book.wouldRecommend && <Badge variant="red">Recomendo</Badge>}
                    {typeof book.rating === "number" && (
                      <Badge variant="muted">★ {book.rating.toFixed(1)}</Badge>
                    )}
                  </div>
                  {book.review && (
                    <p className="text-xs text-[var(--bc-muted)] line-clamp-3">{book.review}</p>
                  )}
                </BookCard>
              ))}
            </div>
          )}

          {books.length > 0 && (
            <div className="mt-10">
              <AffiliateDisclosure />
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-6 bg-[var(--bc-surface)] border-t border-[var(--bc-border)]">
        <NewsletterCTA
          source="recommendations"
          title="Gostou da curadoria?"
          description="Entre para o Clube dos Leitores BookCringe e receba novas recomendações diretamente no seu e-mail."
        />
      </section>
    </>
  );
}
