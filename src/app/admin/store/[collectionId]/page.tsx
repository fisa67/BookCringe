import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import {
  deleteStoreCollectionAction,
  deleteStoreProductAction,
} from "@/app/admin/store/actions";
import {
  getStoreCollectionById,
  getStoreProducts,
} from "@/lib/services/storeService";

export const metadata: Metadata = {
  title: "Coleção — BookCringe Store",
};

interface StoreCollectionDetailPageProps {
  params: Promise<{ collectionId: string }>;
  searchParams: Promise<{ error?: string }>;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export default async function StoreCollectionDetailPage({
  params,
  searchParams,
}: StoreCollectionDetailPageProps) {
  const [{ collectionId }, { error }] = await Promise.all([params, searchParams]);
  const collection = await getStoreCollectionById(collectionId);

  if (!collection) notFound();

  const products = await getStoreProducts(collection.id);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">BookCringe Store</p>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  collection.is_active
                    ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-300"
                    : "border-slate-700 bg-slate-900 text-slate-400"
                }`}
              >
                {collection.is_active ? "Ativa" : "Inativa"}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-white">{collection.name}</h1>
            {collection.description ? (
              <p className="mt-4 max-w-2xl text-slate-300">{collection.description}</p>
            ) : null}
            <p className="mt-3 text-sm text-slate-400">
              {collection.total_quantity} unidade(s) na coleção · {products?.length ?? 0} produto(s)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/store/interests?collection=${collection.id}`}
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Ver interesses
            </Link>
            <Link
              href="/bookcringe-store"
              target="_blank"
              className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Ver Store pública
            </Link>
            <Link
              href={`/admin/store/${collection.id}/edit`}
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Editar coleção
            </Link>
          </div>
        </div>
        {error ? (
          <p role="alert" className="mt-5 rounded-md border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Produtos da coleção</h2>
            <p className="mt-1 text-sm text-slate-400">A ordem controla a exibição na Store.</p>
          </div>
          <Link
            href={`/admin/store/${collection.id}/products/new`}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            + Adicionar produto
          </Link>
        </div>

        {products === null ? (
          <p className="mt-6 rounded-md border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300">
            Não foi possível carregar os produtos.
          </p>
        ) : products.length === 0 ? (
          <p className="mt-6 rounded-md border border-dashed border-slate-700 p-6 text-sm text-slate-400">
            Nenhum produto cadastrado ainda.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex min-w-0 gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        product.is_active
                          ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-300"
                          : "border-slate-700 bg-slate-950 text-slate-500"
                      }`}
                    >
                      {product.is_active ? "Ativo" : "Inativo"}
                    </span>
                    {product.crew_exclusive ? (
                      <span className="rounded-full border border-red-900/60 bg-red-950/40 px-2 py-0.5 text-xs text-red-300">
                        Crew
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 truncate font-semibold text-white" title={product.name}>
                    {product.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatPrice(product.price)} · {product.quantity} unidade(s) · ordem {product.position}
                  </p>
                  {product.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">{product.description}</p>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2 pt-3">
                    <Link
                      href={`/admin/store/${collection.id}/products/${product.id}/edit`}
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-slate-500"
                    >
                      Editar
                    </Link>
                    <ConfirmSubmitButton
                      action={deleteStoreProductAction.bind(null, collection.id, product.id)}
                      confirmMessage={`Remover "${product.name}" desta coleção?`}
                      label="Excluir"
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <ConfirmSubmitButton
          action={deleteStoreCollectionAction.bind(null, collection.id)}
          confirmMessage={`Excluir a coleção "${collection.name}" e todos os produtos? Essa ação não pode ser desfeita.`}
          label="Excluir coleção"
        />
      </div>
    </div>
  );
}
