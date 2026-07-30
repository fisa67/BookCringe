import Link from "next/link";
import type { Metadata } from "next";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { deleteStoreCollectionAction } from "@/app/admin/store/actions";
import { getStoreCollections, getStoreProducts } from "@/lib/services/storeService";

export const metadata: Metadata = {
  title: "BookCringe Store — Admin",
};

interface AdminStorePageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminStorePage({ searchParams }: AdminStorePageProps) {
  const { error } = await searchParams;
  const collections = await getStoreCollections();
  const productCounts = collections
    ? await Promise.all(
        collections.map(async (collection) => {
          const products = await getStoreProducts(collection.id);
          return [collection.id, products?.length ?? 0] as const;
        })
      )
    : [];
  const productCountByCollection = new Map(productCounts);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Store</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Coleções da BookCringe Store</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Organize pequenas tiragens, produtos físicos e itens exclusivos do Crew.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/store/interests"
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Ver interesses
            </Link>
            <Link
              href="/admin/store/new"
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              + Nova coleção
            </Link>
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {collections === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar as coleções. Tente novamente em alguns instantes.
        </p>
      ) : collections.length === 0 ? (
        <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
          Nenhuma coleção cadastrada ainda.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <li
              key={collection.id}
              className="flex flex-col justify-between gap-5 rounded-3xl border border-slate-800 bg-slate-950/80 p-6"
            >
              <div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    collection.is_active
                      ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-300"
                      : "border-slate-700 bg-slate-900 text-slate-400"
                  }`}
                >
                  {collection.is_active ? "Ativa" : "Inativa"}
                </span>
                <h2 className="mt-3 text-xl font-semibold text-white">{collection.name}</h2>
                {collection.description ? (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-400">{collection.description}</p>
                ) : null}
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {productCountByCollection.get(collection.id) ?? 0} produto(s) ·{" "}
                  {collection.total_quantity} unidade(s)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/store/${collection.id}`}
                  className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
                >
                  Gerenciar
                </Link>
                <Link
                  href={`/admin/store/${collection.id}/edit`}
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
                >
                  Editar
                </Link>
                <ConfirmSubmitButton
                  action={deleteStoreCollectionAction.bind(null, collection.id)}
                  confirmMessage={`Excluir a coleção "${collection.name}" e todos os produtos? Essa ação não pode ser desfeita.`}
                  label="Excluir"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
