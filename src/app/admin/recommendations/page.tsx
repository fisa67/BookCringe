import Link from "next/link";
import type { Metadata } from "next";
import { getRecommendationHistory } from "@/lib/services/monthlyRecommendationService";
import {
  computeDaysHighlighted,
  getRecommendationHistoryStatus,
  RECOMMENDATION_HISTORY_STATUS_BADGE_CLASS,
  RECOMMENDATION_HISTORY_STATUS_LABELS,
} from "@/lib/admin/recommendationHistoryLabels";

export const metadata: Metadata = {
  title: "Recomendação do mês — Admin BookCringe",
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { dateStyle: "short" });
}

/**
 * Histórico editorial da "Recomendação do mês" (ver
 * `monthlyRecommendationService.getRecommendationHistory`) — só leitura,
 * sem ações nesta tela. O destaque atual continua sendo gerenciado pelo
 * checkbox "✅ Recomendação do mês" em `/admin/books/[id]/edit`
 * (`ReadingForm`); esta página é o log de quando cada livro esteve em
 * destaque, não um editor.
 */
export default async function AdminRecommendationsPage() {
  const history = await getRecommendationHistory();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Curadoria BookCringe</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Recomendação do mês</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Histórico de todos os livros que já foram a Recomendação do mês, com o período em que cada um
          ficou em destaque. Para trocar o destaque atual, marque &ldquo;✅ Recomendação do mês&rdquo; na
          edição do livro em{" "}
          <Link href="/admin/books" className="underline hover:text-white">
            Biblioteca
          </Link>
          .
        </p>
      </div>

      {history === null ? (
        <p className="rounded-3xl border border-red-900/60 bg-red-950/40 p-6 text-sm text-red-300">
          Não foi possível carregar o histórico. Tente novamente em alguns instantes.
        </p>
      ) : history.length === 0 ? (
        <p className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-sm text-slate-400">
          Nenhum livro foi marcado como Recomendação do mês ainda.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.2em] text-slate-400">
                <th className="px-5 py-4 font-medium">Livro</th>
                <th className="px-5 py-4 font-medium">Início</th>
                <th className="px-5 py-4 font-medium">Fim</th>
                <th className="px-5 py-4 font-medium">Dias em destaque</th>
                <th className="px-5 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => {
                const status = getRecommendationHistoryStatus(entry.ended_at);
                return (
                  <tr key={entry.id} className="border-b border-slate-800/60 last:border-b-0">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/books/${entry.book_id}/edit`}
                        className="font-medium text-white underline-offset-2 hover:underline"
                      >
                        {entry.books?.title ?? "Livro removido"}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{formatDate(entry.started_at)}</td>
                    <td className="px-5 py-4 text-slate-300">
                      {entry.ended_at ? formatDate(entry.ended_at) : "Atual"}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {computeDaysHighlighted(entry.started_at, entry.ended_at)} dia(s)
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${RECOMMENDATION_HISTORY_STATUS_BADGE_CLASS[status]}`}
                      >
                        {RECOMMENDATION_HISTORY_STATUS_LABELS[status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
