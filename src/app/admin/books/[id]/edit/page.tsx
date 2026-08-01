import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBookById } from "@/lib/services/bookService";
import { getReadingByBook } from "@/lib/services/bookReadingService";
import { getBookParticipations } from "@/lib/adapters/bookParticipationsAdapter";
import { getBookTimeline } from "@/lib/adapters/bookTimelineAdapter";
import { runBookInsightRules } from "@/lib/books/insights/engine";
import { BookForm } from "@/components/admin/books/BookForm";
import { ReadingForm } from "@/components/admin/books/ReadingForm";
import { BookParticipationsSection } from "@/components/admin/books/BookParticipationsSection";
import { BookTimelineSection } from "@/components/admin/books/BookTimelineSection";
import { BookInsightsSection } from "@/components/admin/books/BookInsightsSection";
import { BookIntelligenceTabs } from "@/components/admin/books/BookIntelligenceTabs";
import { QuickActionsCard } from "@/components/admin/books/QuickActionsCard";
import {
  updateBookAction,
  saveReadingAction,
  markAsRecommendationOfMonthAction,
} from "@/app/admin/books/actions";

export const metadata: Metadata = {
  title: "Editar livro — Admin BookCringe",
};

interface EditBookPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; readingError?: string }>;
}

export default async function EditBookPage({ params, searchParams }: EditBookPageProps) {
  const { id } = await params;
  const { error, readingError } = await searchParams;
  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  const [reading, participations, timeline] = await Promise.all([
    getReadingByBook(id),
    getBookParticipations(id),
    getBookTimeline(id),
  ]);

  const insights = runBookInsightRules({
    now: new Date(),
    book: { id: book.id, slug: book.slug },
    reading: reading
      ? {
          rating: reading.rating,
          favorite: reading.favorite,
          would_recommend: reading.would_recommend,
          status: reading.status,
          finished_at: reading.finished_at,
        }
      : null,
    participations,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Biblioteca</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Editar livro</h1>
        <p className="mt-4 max-w-2xl text-slate-300">{book.title}</p>
      </div>

      <QuickActionsCard
        book={book}
        isRecommendationOfMonth={reading?.is_recommendation_of_month ?? false}
        markAsRecommendationOfMonthAction={markAsRecommendationOfMonthAction.bind(null, book.id)}
      />

      <BookIntelligenceTabs
        insightsCount={insights.length}
        overview={
          <BookParticipationsSection
            bookId={book.id}
            participations={participations}
            favorite={reading?.favorite ?? false}
            wouldRecommend={reading?.would_recommend ?? false}
          />
        }
        timeline={<BookTimelineSection events={timeline} />}
        insights={<BookInsightsSection insights={insights} />}
      />

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <BookForm
          action={updateBookAction.bind(null, book.id)}
          book={book}
          submitLabel="Salvar alterações"
          errorMessage={error}
        />
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Dados de leitura</p>
        <h2 className="mt-2 mb-6 text-xl font-semibold text-white">Nota, resenha e favoritos</h2>
        <ReadingForm
          action={saveReadingAction.bind(null, book.id)}
          reading={reading}
          submitLabel="Salvar leitura"
          errorMessage={readingError}
        />
      </div>
    </div>
  );
}
