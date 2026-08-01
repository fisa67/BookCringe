import Link from "next/link";
import type { BookInsight, BookInsightSeverity } from "@/lib/books/insights/types";

interface BookInsightsSectionProps {
  insights: BookInsight[];
}

const SEVERITY_STYLES: Record<BookInsightSeverity, { border: string; icon: string }> = {
  info: { border: "border-sky-900/60 bg-sky-950/20", icon: "💡" },
  warning: { border: "border-amber-900/60 bg-amber-950/20", icon: "⚠️" },
  success: { border: "border-emerald-900/60 bg-emerald-950/20", icon: "✅" },
};

const actionLinkClass =
  "mt-3 inline-flex rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-500 hover:text-white";

/**
 * Aba "Insights" de `/admin/books/[id]/edit` — "próximas ações sugeridas" e
 * observações editoriais, geradas por `runBookInsightRules`
 * (`src/lib/books/insights/`). Insights com `actionHref` viram um botão;
 * os demais são só informativos (a ação real já existe em outro lugar da
 * página, ex.: Ações Rápidas).
 */
export function BookInsightsSection({ insights }: BookInsightsSectionProps) {
  if (insights.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-sm text-slate-500">
          Nenhuma oportunidade identificada agora — este livro está em dia em todos os módulos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => {
        const style = SEVERITY_STYLES[insight.severity];

        return (
          <div key={insight.id} className={`rounded-2xl border p-4 ${style.border}`}>
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none" aria-hidden>
                {style.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{insight.title}</p>
                <p className="mt-1 text-sm text-slate-300">{insight.message}</p>
                {insight.actionHref && insight.actionLabel ? (
                  <Link
                    href={insight.actionHref}
                    target={insight.actionExternal ? "_blank" : undefined}
                    rel={insight.actionExternal ? "noopener noreferrer" : undefined}
                    className={actionLinkClass}
                  >
                    {insight.actionLabel}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
