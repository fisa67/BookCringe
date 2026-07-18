import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { getPublicLibraryBooks } from "@/lib/adapters/libraryPublicAdapter";
import { LibraryShelf } from "@/components/library/LibraryShelf";
import { AffiliateDisclosure } from "@/components/book/AffiliateDisclosure";

export const metadata: Metadata = {
  title: "Biblioteca",
  description:
    "Todos os livros lidos pelo BookCringe — com notas, resenhas e dados. Filtrados por gênero, autor e país.",
};

// Biblioteca lê o catálogo do Supabase via getPublicLibraryBooks — mesma
// estratégia de revalidate de src/app/page.tsx, src/app/clube-de-leitura/page.tsx
// e src/app/estatisticas/page.tsx.
export const revalidate = 3600;

export default async function BibliotecaPage() {
  const books = await getPublicLibraryBooks();

  return (
    <>
      <PageHero
        eyebrow="Biblioteca"
        title="Todos os livros lidos."
        description="Uma coleção de leituras com notas, resenhas e reflexões. Em construção contínua."
      />

      <LibraryShelf books={books} />

      <div className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <AffiliateDisclosure />
        </div>
      </div>
    </>
  );
}
