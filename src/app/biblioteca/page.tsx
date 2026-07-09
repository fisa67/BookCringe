import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { mockRecentBooks } from "@/data/mock/stats";
import { LibraryShelf } from "@/components/library/LibraryShelf";

export const metadata: Metadata = {
  title: "Biblioteca",
  description:
    "Todos os livros lidos pelo BookCringe — com notas, resenhas e dados. Filtrados por gênero, autor e país.",
};

export default function BibliotecaPage() {
  return (
    <>
      <PageHero
        eyebrow="Biblioteca"
        title="Todos os livros lidos."
        description="Uma coleção de leituras com notas, resenhas e reflexões. Em construção contínua."
      />

      <LibraryShelf books={mockRecentBooks} />
    </>
  );
}
