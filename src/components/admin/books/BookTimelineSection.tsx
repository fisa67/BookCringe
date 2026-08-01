import Link from "next/link";
import type { BookTimelineEvent, BookTimelineEventType } from "@/lib/adapters/bookTimelineAdapter";

interface BookTimelineSectionProps {
  events: BookTimelineEvent[];
}

const EVENT_ICONS: Record<BookTimelineEventType, string> = {
  book_added: "📚",
  reading_started: "📖",
  reading_finished: "✅",
  recommendation_started: "⭐",
  recommendation_ended: "⚪",
  content_published: "🎥",
  campaign_item_added: "🎁",
  club_month_added: "📅",
  ratings_milestone: "💬",
};

function formatEventDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * Aba "Timeline" de `/admin/books/[id]/edit` — lista cronológica (mais
 * recente primeiro) de tudo que já aconteceu com o livro nos demais
 * módulos, vinda de `getBookTimeline` (`bookTimelineAdapter`). Puramente
 * de exibição: nenhum evento é calculado aqui, só formatado.
 */
export function BookTimelineSection({ events }: BookTimelineSectionProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-sm text-slate-500">Ainda não há eventos registrados para este livro.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
      <ol className="space-y-4">
        {events.map((event) => (
          <li key={event.id} className="flex items-start gap-3">
            <span className="mt-0.5 text-lg leading-none" aria-hidden>
              {EVENT_ICONS[event.type]}
            </span>
            <div className="min-w-0 flex-1">
              {event.href ? (
                <Link href={event.href} className="text-sm text-slate-200 hover:text-white hover:underline">
                  {event.label}
                </Link>
              ) : (
                <p className="text-sm text-slate-200">{event.label}</p>
              )}
              <p className="mt-0.5 text-xs text-slate-500">{formatEventDate(event.date)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
