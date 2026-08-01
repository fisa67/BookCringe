import Link from "next/link";
import type { CmsBookRecord } from "@/lib/types/cms";

interface QuickActionsCardProps {
  book: CmsBookRecord;
  isRecommendationOfMonth: boolean;
  markAsRecommendationOfMonthAction: (formData: FormData) => void | Promise<void>;
}

const actionButtonClass =
  "rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Card "Ações rápidas" de `/admin/books/[id]/edit` — cada botão abre a tela
 * correspondente já com este livro pré-selecionado (via query string), em
 * vez de o admin precisar navegar e selecionar o livro de novo. "Marcar
 * como recomendação do mês" não tem tela própria (é um campo de
 * `book_readings`), então dispara a Server Action diretamente.
 *
 * "Adicionar à campanha" passa por `/admin/campaigns` (uma campanha pode
 * ter vários itens, então o admin escolhe qual) — o `bookId` na querystring
 * segue adiante em cada campanha até `items/new`, que já abre com o livro
 * pré-selecionado (fluxo "Selecionar um livro da Biblioteca").
 */
export function QuickActionsCard({
  book,
  isRecommendationOfMonth,
  markAsRecommendationOfMonthAction,
}: QuickActionsCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Biblioteca</p>
      <h2 className="mt-2 mb-6 text-xl font-semibold text-white">Ações rápidas</h2>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/content/new?bookId=${book.id}&platform=instagram&type=reel`}
          className={actionButtonClass}
        >
          🎥 Criar Reel
        </Link>
        <Link
          href={`/admin/content/new?bookId=${book.id}&platform=tiktok&type=short`}
          className={actionButtonClass}
        >
          🎵 Criar TikTok
        </Link>
        <Link
          href={`/admin/content/new?bookId=${book.id}&platform=youtube&type=short`}
          className={actionButtonClass}
        >
          ▶️ Criar Short
        </Link>
        <Link
          href={`/admin/content/new?bookId=${book.id}&platform=website&type=review`}
          className={actionButtonClass}
        >
          ✍️ Criar Review
        </Link>
        <Link href={`/admin/campaigns?bookId=${book.id}`} className={actionButtonClass}>
          🎁 Adicionar à campanha
        </Link>
        <form action={markAsRecommendationOfMonthAction}>
          <button type="submit" disabled={isRecommendationOfMonth} className={actionButtonClass}>
            ✅ {isRecommendationOfMonth ? "Já é a recomendação do mês" : "Marcar como recomendação do mês"}
          </button>
        </form>
        <Link href={`/livro/${book.slug}`} target="_blank" rel="noopener noreferrer" className={actionButtonClass}>
          🔗 Compartilhar
        </Link>
      </div>
    </div>
  );
}
