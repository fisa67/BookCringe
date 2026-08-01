import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceImportRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import type { CmsBookRecord } from "@/lib/types/cms";
import type {
  IntelligenceDashboardData,
  LatestImportSummary,
  MatchingRateSummary,
  PlatformDistributionEntry,
  TopContentEntry,
} from "@/lib/intelligence/dashboard/types";
import { runIntelligenceRules } from "@/lib/intelligence/insights";

/**
 * Deriva o Dashboard inteiro a partir dos dados já persistidos — nenhuma
 * consulta acontece aqui, só agregação em memória sobre o que
 * `intelligenceDashboardService.getIntelligenceDashboardData` já buscou via
 * os services existentes. Mesma divisão de responsabilidade de
 * `session/summary.ts`: I/O fica no service, derivação pura fica aqui
 * (testável sem mockar Supabase).
 *
 * Métrica usada no Top 10: "views" — hoje a única com sentido de "alcance"
 * entre as 4 que o YouTube reporta. Adicionar uma nova visão (ex.: Top 10
 * por watch time) é só uma nova chamada a `latestMetricValueByContent` com
 * outra chave, sem mudar mais nada aqui.
 */
const TOP_CONTENT_METRIC_KEY = "views";
const DEFAULT_TOP_CONTENTS_LIMIT = 10;

function isLinked(content: IntelligenceContentRecord): boolean {
  return Boolean(content.book_id);
}

/**
 * Metrics são imutáveis: cada Import insere uma linha nova
 * (`docs/intelligence.md#persistência`). Para "o valor atual" de uma chave
 * por Content, pegamos a leitura mais recente (`measured_at`), não a soma —
 * cada leitura já é o total reportado pela plataforma naquele Import.
 */
function latestMetricValueByContent(metrics: IntelligenceMetricRecord[], key: string): Map<string, number> {
  const latest = new Map<string, { value: number; measuredAt: string }>();

  for (const metric of metrics) {
    if (metric.key !== key || !metric.content_id) continue;

    const current = latest.get(metric.content_id);
    if (!current || metric.measured_at > current.measuredAt) {
      latest.set(metric.content_id, { value: metric.value, measuredAt: metric.measured_at });
    }
  }

  return new Map(Array.from(latest, ([contentId, entry]) => [contentId, entry.value]));
}

function buildLatestImport(
  imports: IntelligenceImportRecord[],
  datasetById: Map<string, IntelligenceDatasetRecord>
): LatestImportSummary | null {
  const [latest] = [...imports].sort((a, b) => b.started_at.localeCompare(a.started_at));
  if (!latest) return null;

  const dataset = datasetById.get(latest.dataset_id);

  return {
    platform: dataset?.platform ?? "unknown",
    datasetName: dataset?.name ?? "Dataset removido",
    fileName: latest.file_name,
    startedAt: latest.started_at,
    status: latest.status,
    acceptedRecords: latest.accepted_records,
    rejectedRecords: latest.rejected_records,
  };
}

function buildTopContents(params: {
  contents: IntelligenceContentRecord[];
  metrics: IntelligenceMetricRecord[];
  datasetById: Map<string, IntelligenceDatasetRecord>;
  bookById: Map<string, CmsBookRecord>;
  limit: number;
}): TopContentEntry[] {
  const viewsByContent = latestMetricValueByContent(params.metrics, TOP_CONTENT_METRIC_KEY);

  return params.contents
    .map((content) => ({ content, views: viewsByContent.get(content.id) ?? 0 }))
    .filter((entry) => entry.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, params.limit)
    .map(({ content, views }) => ({
      contentId: content.id,
      title: content.title,
      platform: params.datasetById.get(content.dataset_id)?.platform ?? "unknown",
      views,
      bookTitle: content.book_id ? params.bookById.get(content.book_id)?.title : undefined,
    }));
}

function buildPlatformDistribution(
  contents: IntelligenceContentRecord[],
  datasetById: Map<string, IntelligenceDatasetRecord>
): PlatformDistributionEntry[] {
  const countByPlatform = new Map<string, number>();

  for (const content of contents) {
    const platform = datasetById.get(content.dataset_id)?.platform ?? "unknown";
    countByPlatform.set(platform, (countByPlatform.get(platform) ?? 0) + 1);
  }

  const total = contents.length;

  return Array.from(countByPlatform, ([platform, contentsCount]) => ({
    platform: platform as PlatformDistributionEntry["platform"],
    contentsCount,
    share: total === 0 ? 0 : contentsCount / total,
  })).sort((a, b) => b.contentsCount - a.contentsCount);
}

function buildMatchingRate(contents: IntelligenceContentRecord[]): MatchingRateSummary {
  const total = contents.length;
  const linked = contents.filter(isLinked).length;

  return { linked, unlinked: total - linked, total, rate: total === 0 ? 0 : linked / total };
}

export function buildIntelligenceDashboardData(params: {
  datasets: IntelligenceDatasetRecord[];
  imports: IntelligenceImportRecord[];
  contents: IntelligenceContentRecord[];
  metrics: IntelligenceMetricRecord[];
  books: CmsBookRecord[];
  topContentsLimit?: number;
  /** Injetável para teste determinístico — as regras baseadas em recência (`insights/`) dependem disso. */
  now?: Date;
}): IntelligenceDashboardData {
  const { datasets, imports, contents, metrics, books, now = new Date() } = params;
  const datasetById = new Map(datasets.map((dataset) => [dataset.id, dataset]));
  const bookById = new Map(books.map((book) => [book.id, book]));
  const linkedBookIds = new Set(
    contents.filter((content) => content.book_id).map((content) => content.book_id as string)
  );

  return {
    summary: {
      datasetsCount: datasets.length,
      importsCount: imports.length,
      contentsCount: contents.length,
      linkedBooksCount: linkedBookIds.size,
    },
    latestImport: buildLatestImport(imports, datasetById),
    topContents: buildTopContents({
      contents,
      metrics,
      datasetById,
      bookById,
      limit: params.topContentsLimit ?? DEFAULT_TOP_CONTENTS_LIMIT,
    }),
    platformDistribution: buildPlatformDistribution(contents, datasetById),
    matchingRate: buildMatchingRate(contents),
    // Rules Engine (Sprint 9) — módulo independente, reusado aqui sem acoplar o Dashboard à sua implementação interna.
    insights: runIntelligenceRules({ now, datasets, imports, contents, metrics }),
  };
}
