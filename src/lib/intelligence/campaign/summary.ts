import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceImportRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

/**
 * Classificador de Dataset "em formato de campanha" (ADR-010) — mesmo papel
 * exercido por `isAudienceDataset`/`isAudienceMetric`
 * (`audience/summary.ts`, ADR-009), mas deliberadamente sem amarrar a
 * nenhuma `platform` específica: a ADR-010 pede que essa forma generalize
 * para qualquer plataforma de mídia paga (TikTok Promotions, Meta Ads,
 * Google Ads, Amazon Ads), então a única convenção usada é o prefixo
 * reservado `promo:` em `Metric.key` — nunca `dataset.platform`.
 *
 * `content_id` é sempre opcional aqui, igual à Audience: uma linha de
 * campanha só carrega `content_id` quando o Adapter conseguiu identificar
 * um item promovido (Opção C do ADR-010); caso contrário, a métrica fica
 * só no Dataset, exatamente como a audiência do Instagram desde a Sprint 14.
 */

const AD_COST_KEY = "promo:adCostBrl";
const VIEWS_KEY = "promo:views";
const NEW_FOLLOWERS_KEY = "promo:newFollowers";
const CAMPAIGN_KEYS = [AD_COST_KEY, VIEWS_KEY, NEW_FOLLOWERS_KEY] as const;

export function isCampaignMetric(metric: IntelligenceMetricRecord): boolean {
  return (CAMPAIGN_KEYS as readonly string[]).includes(metric.key);
}

export function isCampaignDataset(
  dataset: IntelligenceDatasetRecord,
  metrics: IntelligenceMetricRecord[]
): boolean {
  return metrics.some((metric) => metric.dataset_id === dataset.id && isCampaignMetric(metric));
}

export interface CampaignEntry {
  /** Identidade lógica estável: `content_id + measured_at`, ou só `measured_at` sem Content. Nunca persistida. */
  key: string;
  contentId?: string;
  /** Título do Content promovido, quando existe; `undefined` para campanhas agregadas sem item identificável. */
  title?: string;
  measuredAt: string;
  adCostBrl: number;
  views: number;
  newFollowers: number;
  /** `adCostBrl / views` — calculado sob demanda, nunca persistido (mesmo padrão de `matchingRate`). `null` quando `views` é 0. */
  costPerView: number | null;
  /** `adCostBrl / newFollowers` — calculado sob demanda, nunca persistido. `null` quando `newFollowers` é 0. */
  costPerFollower: number | null;
}

export interface CampaignDatasetSummary {
  datasetId: string;
  datasetName: string;
  platform: IntelligenceDatasetRecord["platform"];
  totalAdCostBrl: number;
  totalViews: number;
  totalNewFollowers: number;
  /** Agregado do Dataset inteiro — calculado, nunca persistido. `null` quando `totalViews` é 0. */
  costPerView: number | null;
  /** Agregado do Dataset inteiro — calculado, nunca persistido. `null` quando `totalNewFollowers` é 0. */
  costPerFollower: number | null;
  entries: CampaignEntry[];
}

interface RawGroup {
  logicalKey: string;
  importId: string;
  contentId?: string;
  measuredAt: string;
  importStartedAt: string;
  newestMetricCreatedAt: string;
  adCostBrl: number;
  views: number;
  newFollowers: number;
  hasAdCostBrl: boolean;
  hasViews: boolean;
  hasNewFollowers: boolean;
}

function logicalKey(metric: IntelligenceMetricRecord): string {
  return JSON.stringify([metric.content_id ?? null, metric.measured_at]);
}

function importedGroupKey(metric: IntelligenceMetricRecord): string {
  return JSON.stringify([metric.import_id, logicalKey(metric)]);
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

export function buildCampaignEntries(
  datasetId: string,
  imports: IntelligenceImportRecord[],
  metrics: IntelligenceMetricRecord[],
  contents: IntelligenceContentRecord[]
): CampaignEntry[] {
  const campaignMetrics = metrics.filter(
    (metric) => metric.dataset_id === datasetId && isCampaignMetric(metric)
  );

  const importStartedAt = new Map(imports.map((entry) => [entry.id, entry.started_at]));
  const groupsByImport = new Map<string, RawGroup>();
  for (const metric of campaignMetrics) {
    const key = importedGroupKey(metric);
    const group: RawGroup = groupsByImport.get(key) ?? {
      logicalKey: logicalKey(metric),
      importId: metric.import_id,
      contentId: metric.content_id,
      measuredAt: metric.measured_at,
      importStartedAt: importStartedAt.get(metric.import_id) ?? metric.created_at,
      newestMetricCreatedAt: metric.created_at,
      adCostBrl: 0,
      views: 0,
      newFollowers: 0,
      hasAdCostBrl: false,
      hasViews: false,
      hasNewFollowers: false,
    };

    if (metric.key === AD_COST_KEY) {
      group.adCostBrl += metric.value;
      group.hasAdCostBrl = true;
    }
    if (metric.key === VIEWS_KEY) {
      group.views += metric.value;
      group.hasViews = true;
    }
    if (metric.key === NEW_FOLLOWERS_KEY) {
      group.newFollowers += metric.value;
      group.hasNewFollowers = true;
    }
    if (metric.created_at > group.newestMetricCreatedAt) {
      group.newestMetricCreatedAt = metric.created_at;
    }
    groupsByImport.set(key, group);
  }

  const completeGroups = Array.from(groupsByImport.values()).filter(
    (group) => group.hasAdCostBrl && group.hasViews && group.hasNewFollowers
  );
  const latestByLogicalKey = new Map<string, RawGroup>();
  for (const group of completeGroups) {
    const current = latestByLogicalKey.get(group.logicalKey);
    const groupRecency = `${group.importStartedAt}:${group.newestMetricCreatedAt}:${group.importId}`;
    const currentRecency = current
      ? `${current.importStartedAt}:${current.newestMetricCreatedAt}:${current.importId}`
      : null;
    if (!currentRecency || groupRecency > currentRecency) {
      latestByLogicalKey.set(group.logicalKey, group);
    }
  }

  const contentById = new Map(contents.map((content) => [content.id, content]));

  return Array.from(latestByLogicalKey.values())
    .map((group) => ({
      key: group.logicalKey,
      contentId: group.contentId,
      title: group.contentId ? contentById.get(group.contentId)?.title : undefined,
      measuredAt: group.measuredAt,
      adCostBrl: group.adCostBrl,
      views: group.views,
      newFollowers: group.newFollowers,
      costPerView: ratio(group.adCostBrl, group.views),
      costPerFollower: ratio(group.adCostBrl, group.newFollowers),
    }))
    .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt));
}

export function buildCampaignDatasetSummaries(
  datasets: IntelligenceDatasetRecord[],
  imports: IntelligenceImportRecord[],
  metrics: IntelligenceMetricRecord[],
  contents: IntelligenceContentRecord[]
): CampaignDatasetSummary[] {
  return datasets
    .filter((dataset) => isCampaignDataset(dataset, metrics))
    .map((dataset) => {
      const entries = buildCampaignEntries(dataset.id, imports, metrics, contents);
      const totalAdCostBrl = entries.reduce((sum, entry) => sum + entry.adCostBrl, 0);
      const totalViews = entries.reduce((sum, entry) => sum + entry.views, 0);
      const totalNewFollowers = entries.reduce((sum, entry) => sum + entry.newFollowers, 0);

      return {
        datasetId: dataset.id,
        datasetName: dataset.name,
        platform: dataset.platform,
        totalAdCostBrl,
        totalViews,
        totalNewFollowers,
        costPerView: ratio(totalAdCostBrl, totalViews),
        costPerFollower: ratio(totalAdCostBrl, totalNewFollowers),
        entries,
      };
    });
}

/** Rótulo de exibição de uma campanha — título do Content quando existe, senão a data medida. */
export function campaignEntryLabel(entry: CampaignEntry): string {
  return entry.title ?? `Promoção de ${entry.measuredAt.slice(0, 10)}`;
}
