import Link from "next/link";
import type { Metadata } from "next";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { deleteBookRatingAction } from "@/app/admin/ratings/actions";
import { getAdminBookRatings } from "@/lib/services/bookRatingService";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Avaliações — Admin BookCringe",
};

interface AdminRatingsPageProps {
  searchParams: Promise<{ error?: string }>;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function renderStars(value: number): string {
  return `${"★".repeat(value)}${"☆".repeat(5 - value)}`;
}

export default async function AdminRatingsPage({
  searchParams,
}: AdminRatingsPageProps) {
  const [{ error }, ratings] = await Promise.all([searchParams, getAdminBookRatings()]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Crew Literário</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Avaliações da comunidade</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Modere as avaliações publicadas pelos membros confirmados do Crew.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            ← Voltar para o painel
          </Link>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <section aria-label="Resumo das avaliações" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Total de avaliações</p>
          <p className="mt-3 text-3xl font-semibold text-white">{ratings?.length ?? "—"}</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 sm:col-span-2">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Moderação</p>
          <p className="mt-3 text-sm text-slate-300">
            Remova comentários inadequados. A média pública é recalculada automaticamente após a remoção.
          </p>
        </div>
      </section>

      {ratings === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar as avaliações. Tente novamente em alguns instantes.
        </p>
      ) : ratings.length === 0 ? (
        <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
          Nenhuma avaliação registrada ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800">
          <table className="min-w-[950px] w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-5 py-4 font-medium">Livro</th>
                <th className="px-5 py-4 font-medium">Leitor</th>
                <th className="px-5 py-4 font-medium">Nota</th>
                <th className="px-5 py-4 font-medium">Comentário</th>
                <th className="px-5 py-4 font-medium">Data</th>
                <th className="px-5 py-4 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/80 text-slate-300">
              {ratings.map((rating) => (
                <tr key={rating.id} className="align-top">
                  <td className="px-5 py-4">
                    {rating.bookSlug ? (
                      <Link
                        href={`/livro/${rating.bookSlug}`}
                        target="_blank"
                        className="font-medium text-white hover:text-[var(--bc-red)]"
                      >
                        {rating.bookTitle}
                      </Link>
                    ) : (
                      <span className="font-medium text-white">{rating.bookTitle}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">{rating.subscriberEmail}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-amber-400" aria-label={`${rating.rating} de 5 estrelas`}>
                    {renderStars(rating.rating)}
                  </td>
                  <td className="max-w-md whitespace-pre-wrap px-5 py-4">{rating.comment || "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4">{formatDateTime(rating.updated_at)}</td>
                  <td className="px-5 py-4">
                    <ConfirmSubmitButton
                      action={deleteBookRatingAction.bind(null, rating.id)}
                      confirmMessage="Remover esta avaliação da comunidade?"
                      label="Remover"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
