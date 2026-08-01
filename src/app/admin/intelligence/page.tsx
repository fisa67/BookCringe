import type { Metadata } from "next";
import Link from "next/link";
import { getIntelligenceDashboardData } from "@/lib/services/intelligenceDashboardService";
import { getWorkspaceActions } from "@/lib/services/workspaceService";
import { PLATFORM_LABELS } from "@/lib/intelligence/session";
import { formatNumber } from "@/lib/utils";
import type {
  IntelligenceDashboardSummary,
  LatestImportSummary,
  MatchingRateSummary,
  PlatformDistributionEntry,
  TopContentEntry,
} from "@/lib/intelligence/dashboard";
import type { Insight, InsightSeverity } from "@/lib/intelligence/insights";
import type { WorkspaceAction, WorkspaceActionCategory } from "@/lib/intelligence/actions";

export const metadata: Metadata = {
  title: "Intelligence — Admin BookCringe",
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : DATE_TIME_FORMATTER.format(parsed);
}

function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

const IMPORT_STATUS_LABELS: Record<string, string> = {
  completed: "Concluído",
  failed: "Falhou",
  processing: "Processando",
  pending: "Pendente",
};

/**
 * Dashboard do Intelligence (Sprint 8, `docs/intelligence/DASHBOARD.md`):
 * a primeira tela que lê exclusivamente dados persistidos, via um único
 * service (`getIntelligenceDashboardData`) — nenhuma query aqui, nenhum
 * acesso direto ao Supabase. Todo número já vem pronto do service; este
 * arquivo só decide como desenhar.
 *
 * "Hoje" (Sprint 12, `docs/intelligence/WORKSPACE.md`) transforma o
 * Dashboard numa central de trabalho diário: as WorkspaceActions são
 * buscadas por um service próprio, `getWorkspaceActions`, em paralelo —
 * de propósito, não fazem parte de `IntelligenceDashboardData`: a
 * arquitetura do Dashboard (`lib/intelligence/dashboard/`) está congelada
 * na v0.1, e o Workspace é um módulo novo, construído por cima da Decision
 * Engine (Sprint 11).
 */
export default async function IntelligenceDashboardPage() {
  const [data, todayActions] = await Promise.all([getIntelligenceDashboardData(), getWorkspaceActions()]);

  if (data.summary.importsCount === 0) {
    return <DashboardEmptyState />;
  }

  return (
    <div className="space-y-6">
      <TodaySection actions={todayActions} />

      <SummaryCards summary={data.summary} />

      <InsightsSection insights={data.insights} />

      <div className="grid gap-6 lg:grid-cols-2">
        <LatestImportPanel latestImport={data.latestImport} />
        <MatchingRatePanel matchingRate={data.matchingRate} />
      </div>

      <PlatformDistributionSection distribution={data.platformDistribution} />

      <TopContentsSection topContents={data.topContents} />
    </div>
  );
}

function DashboardEmptyState() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-400">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 3v18h18" />
          <path d="M7 15l4-6 3 3 5-8" />
        </svg>
      </div>
      <p className="mt-4 font-semibold text-white">Nenhum dado importado ainda</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
        O Dashboard mostra métricas reais assim que a primeira importação for concluída. Comece em{" "}
        <Link href="/admin/intelligence/importacoes" className="text-emerald-300 hover:underline">
          Importações
        </Link>
        .
      </p>
    </section>
  );
}

function SummaryCards({ summary }: { summary: IntelligenceDashboardSummary }) {
  const cards: { label: string; value: number }[] = [
    { label: "Datasets", value: summary.datasetsCount },
    { label: "Imports", value: summary.importsCount },
    { label: "Conteúdos", value: summary.contentsCount },
    { label: "Livros associados", value: summary.linkedBooksCount },
  ];

  return (
    <section aria-label="Resumo geral" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{formatNumber(card.value)}</p>
        </div>
      ))}
    </section>
  );
}

const TODAY_PRIORITY_LABELS: Record<WorkspaceAction["priority"], string> = {
  high: "Alta prioridade",
  medium: "Prioridade média",
  low: "Baixa prioridade",
};

const TODAY_PRIORITY_STYLES: Record<WorkspaceAction["priority"], string> = {
  high: "border-red-900/60 bg-red-950/30",
  medium: "border-amber-900/60 bg-amber-950/20",
  low: "border-slate-700 bg-slate-950/60",
};

const TODAY_PRIORITY_DOT: Record<WorkspaceAction["priority"], string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-slate-400",
};

const TODAY_CATEGORY_LABELS: Record<WorkspaceActionCategory, string> = {
  book: "Livro",
  dataset: "Importações",
  matching: "Matching",
};

/**
 * "Hoje" (Sprint 12): o topo do Dashboard deixa de ser só um resumo e
 * passa a ser uma central de trabalho diário — cada WorkspaceAction
 * (`lib/intelligence/actions/`, `docs/intelligence/WORKSPACE.md`) já vem
 * pronta com um botão funcional (`href`), transformando a Decision Engine
 * (Sprint 11) em algo clicável, não só legível. Substitui a antiga seção
 * "Próximas ações recomendadas".
 */
function TodaySection({ actions }: { actions: WorkspaceAction[] }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Hoje</p>

      {actions.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          Nenhuma ação prioritária hoje — continue importando e vinculando conteúdos normalmente.
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {actions.map((action) => (
            <li key={action.id} className={`rounded-2xl border p-4 ${TODAY_PRIORITY_STYLES[action.priority]}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TODAY_PRIORITY_DOT[action.priority]}`} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-white">{action.title}</p>
                      <span className="text-xs uppercase tracking-wide text-slate-500">
                        {TODAY_PRIORITY_LABELS[action.priority]}
                      </span>
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
                        {TODAY_CATEGORY_LABELS[action.category]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{action.description}</p>
                    <p className="mt-1 text-xs text-slate-500">{action.rationale}</p>
                  </div>
                </div>
                <Link
                  href={action.href}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
                >
                  {action.buttonLabel}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const INSIGHT_SEVERITY_STYLES: Record<InsightSeverity, string> = {
  critical: "border-red-900/60 bg-red-950/30",
  warning: "border-amber-900/60 bg-amber-950/20",
  info: "border-slate-700 bg-slate-950/60",
};

const INSIGHT_SEVERITY_DOT: Record<InsightSeverity, string> = {
  critical: "bg-red-400",
  warning: "bg-amber-400",
  info: "bg-slate-400",
};

/**
 * "Insights" — o Dashboard deixa de só mostrar números e passa a orientar
 * o usuário (Sprint 9): recomendações do Rules Engine
 * (`lib/intelligence/insights/`, `docs/intelligence-insights.md`), não de
 * IA. Cada `Insight` já vem pronto do service; esta seção só desenha.
 */
function InsightsSection({ insights }: { insights: Insight[] }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Insights</p>

      {insights.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          Nenhuma recomendação no momento — os Datasets estão atualizados e os conteúdos, vinculados.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 ${INSIGHT_SEVERITY_STYLES[insight.severity]}`}
            >
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${INSIGHT_SEVERITY_DOT[insight.severity]}`} />
              <div>
                <p className="text-sm font-medium text-white">{insight.title}</p>
                <p className="mt-1 text-sm text-slate-300">{insight.message}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LatestImportPanel({ latestImport }: { latestImport: LatestImportSummary | null }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Última importação</p>

      {!latestImport ? (
        <p className="mt-4 text-sm text-slate-400">Nenhuma importação registrada ainda.</p>
      ) : (
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Plataforma</dt>
            <dd className="font-medium text-white">{platformLabel(latestImport.platform)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Data</dt>
            <dd className="font-medium text-white">{formatDateTime(latestImport.startedAt)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Arquivo</dt>
            <dd className="max-w-[60%] truncate font-medium text-white" title={latestImport.fileName}>
              {latestImport.fileName}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Registros</dt>
            <dd className="font-medium text-white">
              {formatNumber(latestImport.acceptedRecords)} aceitos
              {latestImport.rejectedRecords > 0 ? (
                <span className="text-red-400"> · {formatNumber(latestImport.rejectedRecords)} rejeitados</span>
              ) : null}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Status</dt>
            <dd
              className={
                latestImport.status === "completed"
                  ? "font-medium text-emerald-300"
                  : latestImport.status === "failed"
                    ? "font-medium text-red-300"
                    : "font-medium text-amber-300"
              }
            >
              {IMPORT_STATUS_LABELS[latestImport.status] ?? latestImport.status}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}

function MatchingRatePanel({ matchingRate }: { matchingRate: MatchingRateSummary }) {
  const percentage = Math.round(matchingRate.rate * 100);

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Taxa de matching</p>
        <span className="text-sm font-semibold text-white">{percentage}%</span>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percentage}%` }} />
      </div>

      <p className="mt-3 text-sm text-slate-400">
        <span className="font-medium text-white">{formatNumber(matchingRate.linked)}</span> vinculado(s) ·{" "}
        <span className="font-medium text-white">{formatNumber(matchingRate.unlinked)}</span> sem vínculo, de{" "}
        {formatNumber(matchingRate.total)} conteúdo(s) no total.
      </p>

      {matchingRate.unlinked > 0 ? (
        <Link
          href="/admin/intelligence/conteudos"
          className="mt-4 inline-block text-sm font-medium text-emerald-300 hover:underline"
        >
          Vincular conteúdos pendentes →
        </Link>
      ) : null}
    </section>
  );
}

function PlatformDistributionSection({ distribution }: { distribution: PlatformDistributionEntry[] }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Distribuição por plataforma</p>

      {distribution.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Nenhum conteúdo importado ainda.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {distribution.map((entry) => (
            <div key={entry.platform} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <p className="text-sm font-medium text-slate-300">{platformLabel(entry.platform)}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(entry.contentsCount)}</p>
              <p className="mt-1 text-xs text-slate-500">{Math.round(entry.share * 100)}% dos conteúdos</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TopContentsSection({ topContents }: { topContents: TopContentEntry[] }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Top 10 conteúdos por views</p>

      {topContents.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Nenhum conteúdo com views registradas ainda.</p>
      ) : (
        <ol className="mt-4 divide-y divide-slate-800">
          {topContents.map((entry, index) => (
            <li key={entry.contentId} className="flex items-center justify-between gap-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-5 shrink-0 text-sm text-slate-500">{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{entry.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {platformLabel(entry.platform)}
                    {entry.bookTitle ? <span className="text-emerald-400"> · {entry.bookTitle}</span> : null}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-white">{formatNumber(entry.views)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
