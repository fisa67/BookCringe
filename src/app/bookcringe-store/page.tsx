import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { StoreProductCard } from "@/components/store/StoreProductCard";
import { getPublicStoreCollectionsSafe } from "@/lib/adapters/storePublicAdapter";

export const metadata: Metadata = {
  title: "BookCringe Store",
  description: "Pequenas tiragens e itens exclusivos para leitores.",
};

export const revalidate = 300;

export default async function BookCringeStorePage() {
  const collections = await getPublicStoreCollectionsSafe();

  return (
    <>
      <PageHero
        eyebrow="BookCringe Store"
        title="Cringe por fora. Cult por dentro."
        subtitle="Pequenas tiragens para leitores."
        description="Coleções limitadas, itens exclusivos e objetos para levar um pouco do BookCringe para fora das páginas."
      />

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          {collections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--bc-border)] p-8 text-sm text-[var(--bc-muted)]">
              A próxima coleção está sendo preparada. Volte em breve.
            </div>
          ) : (
            <div className="space-y-16">
              {collections.map((collection) => (
                <section key={collection.id} aria-labelledby={`collection-${collection.id}`}>
                  <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                    <div className="max-w-2xl">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--bc-red)]">
                        Coleção limitada
                      </p>
                      <h2
                        id={`collection-${collection.id}`}
                        className="mt-2 text-3xl font-bold tracking-tight text-[var(--bc-ink)]"
                      >
                        {collection.name}
                      </h2>
                      {collection.description ? (
                        <p className="mt-3 text-base leading-relaxed text-[var(--bc-muted)]">
                          {collection.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium text-[var(--bc-muted)]">
                      {collection.total_quantity} unidades na coleção
                    </p>
                  </div>

                  {collection.products.length === 0 ? (
                    <p className="text-sm text-[var(--bc-muted)]">
                      Os itens desta coleção estão sendo preparados.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {collection.products.map((product) => (
                        <StoreProductCard
                          key={product.id}
                          collectionName={collection.name}
                          product={product}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
