import type { Metadata } from "next";
import Link from "next/link";
import { getIntelligenceDashboardData } from "@/lib/services/intelligenceDashboardService";
import { getWorkspaceActions } from "@/lib/services/workspaceService";
import { PLATFORM_LABELS } from "@/lib/intelligence/session";
import { formatNumber } from "@/lib/utils";
import type {
  AudienceDatasetSummary,
  CampaignDatasetSummary,
  DashboardCorrelations,
  IntelligenceDashboardSummary,
  LatestImportSummary,
  MatchingRateSummary,
  PlatformDistributionEntry,
  TopContentEntry,
} from "@/lib/intelligence/dashboard";
import { campaignEntryLabel } from "@/lib/intelligence/dashboard";
import type { Insight, InsightSeverity } from "@/lib/intelligence/insights";
import type { WorkspaceAction, WorkspaceActionCategory } from "@/lib/intelligence/actions";

export const metadata: Metadata = {
  title: "Intelligence — Admin BookCringe",
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });
const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : DATE_TIME_FORMATTER.format(parsed);
}

function formatBRL(value: number): string {
  return BRL_FORMATTER.format(value);
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

      <CorrelationsSection correlations={data.correlations} />

      <AudienceSection audience={data.audience} />

      <CampaignSection campaign={data.campaign} />

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

function CorrelationsSection({ correlations }: { correlations: DashboardCorrelations }) {
  const entries = [
    { key: "growth", label: "Growth Drivers", result: correlations.growth },
    { key: "engagement", label: "Engagement Drivers", result: correlations.engagement },
    { key: "acquisition", label: "Acquisition Drivers", result: correlations.acquisition },
    { key: "retention", label: "Retention Drivers", result: correlations.retention },
  ].filter((entry) => entry.result !== null);

  if (entries.length === 0) return null;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Content ↔ Audience Correlations</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {entries.map(({ key, label, result }) => {
          if (!result) return null;

          return (
            <article key={key} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{label}</p>
                <span
                  className={
                    result.confidence === "high"
                      ? "rounded-full border border-emerald-800 px-2 py-0.5 text-xs text-emerald-300"
                      : "rounded-full border border-amber-800 px-2 py-0.5 text-xs text-amber-300"
                  }
                >
                  {result.confidence} confidence
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-200">
                {result.theme} → {result.title}
              </p>
              {result.format ? <p className="mt-1 text-xs text-slate-500">Formato: {result.format}</p> : null}
              <p className="mt-2 text-sm text-slate-400">{result.evidence}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AudienceSection({ audience }: { audience: AudienceDatasetSummary[] }) {
  if (audience.length === 0) return null;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Audiência</p>

      <div className="mt-4 space-y-5">
        {audience.map((entry) => (
          <div key={entry.datasetId} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <p className="text-sm font-medium text-white">{entry.datasetName}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <AudienceMetricCard
                label="Seguidores"
                value={entry.followers ? formatNumber(entry.followers.value) : "—"}
              />
              <AudienceMetricCard
                label="Crescimento"
                value={
                  entry.followerGrowth
                    ? `${entry.followerGrowth.value > 0 ? "+" : ""}${formatNumber(entry.followerGrowth.value)}`
                    : "—"
                }
              />
              <AudienceMetricCard
                label="Seguidores ativos (pico)"
                value={
                  entry.activityPeak
                    ? `${new Date(entry.activityPeak.measuredAt).getUTCHours()}h · ${formatNumber(entry.activityPeak.value)}`
                    : "—"
                }
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <AudienceDistribution
                title="Distribuição de gênero"
                entries={entry.genderDistribution}
              />
              <AudienceDistribution
                title="Distribuição de territórios"
                entries={entry.territoryDistribution}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AudienceMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function AudienceDistribution({
  title,
  entries,
}: {
  title: string;
  entries: AudienceDatasetSummary["genderDistribution"];
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Sem dados importados.</p>
      ) : (
        <dl className="mt-2 space-y-2 text-sm">
          {entries.map((entry) => (
            <div key={entry.label} className="flex items-center justify-between gap-3">
              <dt className="text-slate-300">{entry.label}</dt>
              <dd className="font-medium text-white">{Math.round(entry.value * 100)}%</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/**
 * "Campanha" (Sprint 20.5, ADR-010): mesma ideia de `AudienceSection`, mas
 * para Datasets "em formato de campanha" (ex.: TikTok — Promoções). Custo
 * por view/seguidor nunca vem persistido — `campaign.costPerView`/
 * `costPerFollower` já chegam calculados por `buildCampaignDatasetSummaries`
 * (`lib/intelligence/campaign/summary.ts`).
 */
function CampaignSection({ campaign }: { campaign: CampaignDatasetSummary[] }) {
  if (campaign.length === 0) return null;

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Campanhas</p>

      <div className="mt-4 space-y-5">
        {campaign.map((entry) => (
          <div key={entry.datasetId} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <p className="text-sm font-medium text-white">{entry.datasetName}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <AudienceMetricCard label="Gasto total" value={formatBRL(entry.totalAdCostBrl)} />
              <AudienceMetricCard label="Views pagas" value={formatNumber(entry.totalViews)} />
              <AudienceMetricCard label="Seguidores adquiridos" value={formatNumber(entry.totalNewFollowers)} />
              <AudienceMetricCard
                label="Custo por seguidor"
                value={entry.costPerFollower !== null ? formatBRL(entry.costPerFollower) : "—"}
              />
            </div>

            {entry.entries.length > 0 ? (
              <ol className="mt-4 divide-y divide-slate-800">
                {entry.entries.map((campaignEntry) => (
                  <li key={campaignEntry.key} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{campaignEntryLabel(campaignEntry)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatBRL(campaignEntry.adCostBrl)} · {formatNumber(campaignEntry.views)} views ·{" "}
                        {formatNumber(campaignEntry.newFollowers)} seguidores
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-white">
                      {campaignEntry.costPerFollower !== null ? formatBRL(campaignEntry.costPerFollower) : "—"}
                      <span className="ml-1 text-xs font-normal text-slate-500">/seguidor</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
