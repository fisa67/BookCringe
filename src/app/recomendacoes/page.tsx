import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { BookCard } from "@/components/book/BookCard";
import { AffiliateDisclosure } from "@/components/book/AffiliateDisclosure";
import { getPublicRecommendedBooks } from "@/lib/adapters/recommendationsPublicAdapter";

export const metadata: Metadata = {
  title: "Recomendações",
  description:
    "Uma seleção pessoal dos livros favoritos, mais recomendados e mais bem avaliados do BookCringe.",
};

// Mesma estratégia de revalidate de /biblioteca, /clube-de-leitura e /estatisticas.
export const revalidate = 3600;

export default async function RecomendacoesPage() {
  const books = await getPublicRecommendedBooks();

  return (
    <>
      <PageHero
        eyebrow="Recomendações"
        title="Os livros que eu faria questão de indicar"
        description="Aqui entram apenas as leituras que passaram pelo meu filtro mais importante: livros que eu gostaria que mais pessoas conhecessem."
      />

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
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
            <>
              <div className="mt-10">
                <AffiliateDisclosure />
              </div>

              <div className="mt-16">
                <NewsletterCTA
                  source="recommendations"
                  title="Junte-se ao Crew Literário 📚"
                  description="Um e-mail de vez em quando. Boas recomendações sempre."
                />
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
