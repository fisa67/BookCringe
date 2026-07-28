import Link from "next/link";
import type { Metadata } from "next";
import {
  getSubscribers,
  getSubscribersCountBySource,
  getSubscribersConfirmationCounts,
  type GetSubscribersSort,
} from "@/lib/services/subscriberService";
import { NEWSLETTER_SOURCES } from "@/lib/validations/newsletter";
import { NEWSLETTER_SOURCE_LABELS } from "@/lib/admin/subscriberLabels";
import type { NewsletterSource } from "@/lib/types/cms";
import { adminInputClass } from "@/components/admin/formStyles";
import { DeleteSubscriberButton } from "@/components/admin/subscribers/DeleteSubscriberButton";
import {
  confirmSubscriberAction,
  deleteSubscriberAction,
  resendConfirmationAction,
} from "@/app/admin/subscribers/actions";

export const metadata: Metadata = {
  title: "Assinantes — Admin BookCringe",
};

const SORT_LABELS: Record<GetSubscribersSort, string> = {
  recent: "Mais recentes",
  oldest: "Mais antigos",
};

type ConfirmedFilter = "confirmed" | "pending";

const CONFIRMED_FILTER_LABELS: Record<ConfirmedFilter, string> = {
  confirmed: "Confirmados",
  pending: "Pendentes",
};

interface AdminSubscribersPageProps {
  searchParams: Promise<{
    search?: string;
    source?: string;
    sort?: string;
    confirmed?: string;
    error?: string;
    deleted?: string;
    resent?: string;
    justConfirmed?: string;
  }>;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminSubscribersPage({ searchParams }: AdminSubscribersPageProps) {
  const params = await searchParams;
  const search = params.search?.trim();
  const source = NEWSLETTER_SOURCES.find((value) => value === params.source) as NewsletterSource | undefined;
  const sort = (["recent", "oldest"] as const).find((value) => value === params.sort) ?? "recent";
  const confirmedFilter = (["confirmed", "pending"] as const).find((value) => value === params.confirmed);
  const confirmed = confirmedFilter === "confirmed" ? true : confirmedFilter === "pending" ? false : undefined;
  const hasFilters = Boolean(search || source || confirmedFilter);
  const { error, deleted, resent, justConfirmed } = params;

  const [subscribers, countsBySource, confirmationCounts] = await Promise.all([
    getSubscribers({ search, source, sort, confirmed }),
    getSubscribersCountBySource(),
    getSubscribersConfirmationCounts(),
  ]);

  const totalCount = countsBySource?.reduce((sum, item) => sum + item.count, 0) ?? null;

  const exportQuery = new URLSearchParams();
  if (search) exportQuery.set("search", search);
  if (source) exportQuery.set("source", source);
  if (sort !== "recent") exportQuery.set("sort", sort);
  if (confirmedFilter) exportQuery.set("confirmed", confirmedFilter);
  const exportHref = `/admin/subscribers/export${exportQuery.toString() ? `?${exportQuery.toString()}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Crew Literário</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Assinantes</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Base de e-mails captada nas páginas públicas do site. Para criar e enviar newsletters para os
          inscritos confirmados, use{" "}
          <Link href="/admin/newsletters" className="underline hover:text-white">
            Newsletters
          </Link>
          .
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {justConfirmed ? (
        <p className="rounded-3xl border border-emerald-900/60 bg-emerald-950/40 p-6 text-sm text-emerald-300">
          ✅ Assinante confirmado com sucesso.
        </p>
      ) : null}
      {deleted ? (
        <p className="rounded-3xl border border-emerald-900/60 bg-emerald-950/40 p-6 text-sm text-emerald-300">
          ✅ Assinante removido com sucesso.
        </p>
      ) : null}
      {resent ? (
        <p className="rounded-3xl border border-emerald-900/60 bg-emerald-950/40 p-6 text-sm text-emerald-300">
          ✅ E-mail de confirmação reenviado.
        </p>
      ) : null}

      {/* Confirmação (double opt-in, Fase 3C) — `confirmed_at` é preenchido
          por `confirmSubscriberByToken` (link do e-mail) ou por
          `confirmSubscriberManually` (botão "✅ Confirmar" abaixo). Contadores
          sempre calculados ao vivo (`getSubscribersConfirmationCounts`), sem
          cache. */}
      <section aria-label="Status de confirmação" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Total de inscritos</p>
          <p className="mt-3 text-3xl font-semibold text-white">{totalCount ?? "—"}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Confirmados</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-400">
            {confirmationCounts?.confirmed ?? "—"}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Pendentes</p>
          <p className="mt-3 text-3xl font-semibold text-white">{confirmationCounts?.unconfirmed ?? "—"}</p>
        </div>
      </section>

      {/* Origem dos cadastros */}
      <section aria-label="Origem dos cadastros" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {NEWSLETTER_SOURCES.map((value) => {
          const count = countsBySource?.find((item) => item.source === value)?.count ?? 0;
          return (
            <div key={value} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{NEWSLETTER_SOURCE_LABELS[value]}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{count}</p>
            </div>
          );
        })}
      </section>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" action="/admin/subscribers">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Buscar por e-mail..."
            className={`${adminInputClass} sm:col-span-2`}
          />
          <select name="source" defaultValue={source ?? ""} className={adminInputClass}>
            <option value="">Todas as origens</option>
            {NEWSLETTER_SOURCES.map((value) => (
              <option key={value} value={value}>
                {NEWSLETTER_SOURCE_LABELS[value]}
              </option>
            ))}
          </select>
          <select name="confirmed" defaultValue={confirmedFilter ?? ""} className={adminInputClass}>
            <option value="">Todos</option>
            {(Object.entries(CONFIRMED_FILTER_LABELS) as [ConfirmedFilter, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={sort} className={adminInputClass}>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-5">
            <button
              type="submit"
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 transition hover:border-slate-500 hover:text-white"
            >
              Filtrar
            </button>
            {hasFilters ? (
              <Link
                href="/admin/subscribers"
                className="flex items-center rounded-md border border-slate-800 px-4 py-2 text-sm text-slate-400 transition hover:text-slate-200"
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

      {subscribers === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar os assinantes. Tente novamente em alguns instantes.
        </p>
      ) : subscribers.length === 0 ? (
        <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
          {hasFilters ? "Nenhum assinante encontrado para os filtros informados." : "Nenhum assinante ainda."}
        </p>
      ) : (
        <ul className="space-y-3">
          {subscribers.map((subscriber) => (
            <li
              key={subscriber.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-white">{subscriber.email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                  <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                    {NEWSLETTER_SOURCE_LABELS[subscriber.source]}
                  </span>
                  {subscriber.confirmed_at ? (
                    <span className="rounded-full border border-emerald-900/60 bg-emerald-950/40 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                      Confirmado
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                      Não confirmado
                    </span>
                  )}
                  <span>{formatDateTime(subscriber.created_at)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!subscriber.confirmed_at ? (
                  <>
                    <form action={confirmSubscriberAction.bind(null, subscriber.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:border-emerald-700 hover:bg-emerald-950/70 hover:text-emerald-200"
                      >
                        ✅ Confirmar
                      </button>
                    </form>
                    <form action={resendConfirmationAction.bind(null, subscriber.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
                      >
                        📬 Reenviar confirmação
                      </button>
                    </form>
                  </>
                ) : null}
                <DeleteSubscriberButton action={deleteSubscriberAction.bind(null, subscriber.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
