import Link from "next/link";
import type { Metadata } from "next";
import { adminInputClass, adminLabelClass } from "@/components/admin/formStyles";
import {
  getStoreInterestDashboard,
  type StoreInterestCollectionGroup,
} from "@/lib/services/storeInterestService";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Interesses da Store — Admin BookCringe",
};

interface AdminStoreInterestsPageProps {
  searchParams: Promise<{
    collection?: string;
    product?: string;
    from?: string;
    to?: string;
  }>;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatCount(value: number): string {
  return value.toLocaleString("pt-BR");
}

function buildQuery(params: {
  collectionId?: string;
  productId?: string;
  from?: string;
  to?: string;
}): string {
  const query = new URLSearchParams();
  if (params.collectionId) query.set("collection", params.collectionId);
  if (params.productId) query.set("product", params.productId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  return query.toString();
}

function PopularityCard({
  label,
  name,
  count,
}: {
  label: string;
  name: string;
  count?: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 line-clamp-2 text-xl font-semibold text-white">{name}</p>
      {count !== undefined ? (
        <p className="mt-2 text-sm text-slate-400">{formatCount(count)} interessado(s)</p>
      ) : null}
    </div>
  );
}

function InterestGroup({ group }: { group: StoreInterestCollectionGroup }) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-white">{group.name}</h3>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-300">
          {formatCount(group.count)} interessado(s)
        </span>
      </div>
      <ul className="mt-5 divide-y divide-slate-800">
        {group.products.map((product) => (
          <li key={product.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <span className="text-slate-200">{product.name}</span>
            <span className="shrink-0 text-sm font-semibold text-slate-400">
              {formatCount(product.count)}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default async function AdminStoreInterestsPage({
  searchParams,
}: AdminStoreInterestsPageProps) {
  const params = await searchParams;
  const collectionId = params.collection?.trim() || undefined;
  const productId = params.product?.trim() || undefined;
  const from = params.from?.trim() || undefined;
  const to = params.to?.trim() || undefined;
  const query = buildQuery({ collectionId, productId, from, to });
  const dashboard = await getStoreInterestDashboard({ collectionId, productId, from, to });
  const exportHref = `/admin/store/interests/export${query ? `?${query}` : ""}`;
  const hasFilters = Boolean(collectionId || productId || from || to);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">BookCringe Store</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Interesses de produtos</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Valide a demanda das coleções antes de decidir quais itens merecem uma primeira tiragem.
            </p>
          </div>
          <Link
            href="/admin/store"
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            ← Voltar para a Store
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" action="/admin/store/interests">
          <div>
            <label htmlFor="store-interest-collection" className={adminLabelClass}>
              Coleção
            </label>
            <select
              id="store-interest-collection"
              name="collection"
              defaultValue={collectionId ?? ""}
              className={`${adminInputClass} mt-1`}
            >
              <option value="">Todas as coleções</option>
              {dashboard?.collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="store-interest-product" className={adminLabelClass}>
              Produto
            </label>
            <select
              id="store-interest-product"
              name="product"
              defaultValue={productId ?? ""}
              className={`${adminInputClass} mt-1`}
            >
              <option value="">Todos os produtos</option>
              {dashboard?.products.map((product) => {
                const collection = dashboard.collections.find(
                  (item) => item.id === product.collection_id
                );
                return (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {collection ? ` — ${collection.name}` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label htmlFor="store-interest-from" className={adminLabelClass}>
              De
            </label>
            <input
              id="store-interest-from"
              name="from"
              type="date"
              defaultValue={from}
              className={`${adminInputClass} mt-1`}
            />
          </div>

          <div>
            <label htmlFor="store-interest-to" className={adminLabelClass}>
              Até
            </label>
            <input
              id="store-interest-to"
              name="to"
              type="date"
              defaultValue={to}
              className={`${adminInputClass} mt-1`}
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Filtrar
            </button>
            {hasFilters ? (
              <Link
                href="/admin/store/interests"
                className="rounded-md border border-slate-800 px-4 py-2 text-sm text-slate-400 transition hover:text-slate-200"
              >
                Limpar
              </Link>
            ) : null}
            <a
              href={exportHref}
              className="ml-auto rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Exportar CSV
            </a>
          </div>
        </form>
      </div>

      {dashboard === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar os interesses. Tente novamente em alguns instantes.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Indicadores, rankings e listagem consideram os filtros aplicados.
          </p>

          <section aria-label="Resumo dos interesses" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PopularityCard label="Total de interesses" name={formatCount(dashboard.totalCount)} />
            <PopularityCard
              label="Coleção mais popular"
              name={dashboard.topCollection?.name ?? "Nenhuma ainda"}
              count={dashboard.topCollection?.count}
            />
            <PopularityCard
              label="Produto mais popular"
              name={dashboard.topProduct ? `🛍️ ${dashboard.topProduct.name}` : "Nenhum ainda"}
              count={dashboard.topProduct?.count}
            />
            <PopularityCard
              label="Últimos 30 dias"
              name={`+${formatCount(dashboard.last30DaysCount)} interesses`}
            />
          </section>

          <section aria-labelledby="store-interest-ranking-title" className="space-y-4">
            <div>
              <h2 id="store-interest-ranking-title" className="text-2xl font-semibold text-white">
                Demanda por coleção e produto
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Produtos ordenados pelo número de pessoas interessadas.
              </p>
            </div>
            {dashboard.collectionGroups.length === 0 ? (
              <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
                Nenhum interesse registrado para os filtros informados.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {dashboard.collectionGroups.map((group) => (
                  <InterestGroup key={group.id} group={group} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="store-interest-list-title" className="space-y-4">
            <div>
              <h2 id="store-interest-list-title" className="text-2xl font-semibold text-white">
                Interesses registrados
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {formatCount(dashboard.interests.length)} registro(s) encontrado(s).
              </p>
            </div>
            {dashboard.interests.length === 0 ? (
              <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
                Nenhum interesse registrado para os filtros informados.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-3xl border border-slate-800">
                <table className="min-w-[900px] w-full divide-y divide-slate-800 text-left text-sm">
                  <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.16em] text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-medium">Produto</th>
                      <th className="px-5 py-4 font-medium">Coleção</th>
                      <th className="px-5 py-4 font-medium">Nome</th>
                      <th className="px-5 py-4 font-medium">E-mail</th>
                      <th className="px-5 py-4 font-medium">Mensagem</th>
                      <th className="px-5 py-4 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/80 text-slate-300">
                    {dashboard.interests.map((interest) => (
                      <tr key={interest.id} className="align-top">
                        <td className="px-5 py-4 font-medium text-white">{interest.productName}</td>
                        <td className="px-5 py-4">{interest.collectionName}</td>
                        <td className="px-5 py-4">{interest.name}</td>
                        <td className="px-5 py-4">{interest.email}</td>
                        <td className="max-w-xs whitespace-pre-wrap px-5 py-4">
                          {interest.message || "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">{formatDateTime(interest.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
