import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { getPublicContents, getPublicContentBookOptions } from "@/lib/adapters/contentPublicAdapter";
import { ContentsExplorer } from "@/components/content/ContentsExplorer";

export const metadata: Metadata = {
  title: "Conteúdos",
  description:
    "Reels, shorts, vídeos, carrosséis e reviews do BookCringe sobre os livros lidos — filtre por tipo ou por livro.",
};

// Mesma estratégia de revalidate das demais páginas públicas que leem do
// Supabase (src/app/page.tsx, src/app/biblioteca/page.tsx etc.).
export const revalidate = 3600;

export default async function ConteudosPage() {
  const [contents, books] = await Promise.all([getPublicContents(), getPublicContentBookOptions()]);

  return (
    <>
      <PageHero
        eyebrow="Conteúdo"
        title="Todos os conteúdos."
        description="Reels, shorts, vídeos, carrosséis e reviews sobre os livros do BookCringe."
      />

      {/* Sem conteúdos publicados no site inteiro (não apenas filtrados) —
          evita montar a barra de filtros/select vazios sem utilidade. */}
      {contents.length === 0 ? (
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto py-12 rounded-xl border border-dashed border-[var(--bc-border)] flex flex-col items-center gap-3 text-center">
            <span className="text-3xl">🎥</span>
            <p className="font-bold text-[var(--bc-ink)]">Nenhum conteúdo publicado ainda</p>
            <p className="text-sm text-[var(--bc-muted)] max-w-sm">
              Reels, shorts, vídeos, carrosséis e reviews aparecerão aqui em breve.
            </p>
          </div>
        </section>
      ) : (
        <ContentsExplorer contents={contents} books={books} />
      )}
    </>
  );
}
