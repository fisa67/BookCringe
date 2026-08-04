import type { Insight, Rule } from "@/lib/intelligence/insights/types";
import { PLATFORM_LABELS } from "@/lib/intelligence/session";
import { isAudienceDataset } from "@/lib/intelligence/audience/summary";
import { isCampaignDataset } from "@/lib/intelligence/campaign/summary";

/** Abaixo de quantos Contents um Dataset é considerado com "pouco conteúdo". */
export const MIN_CONTENTS_PER_DATASET = 3;

/**
 * "Pouco conteúdo associado": um Dataset com poucos Contents ainda não dá
 * uma base confiável para o Top 10 ou para a distribuição por plataforma
 * (`docs/intelligence-dashboard.md`) — é um aviso, não um erro.
 */
export const lowContentVolumeRule: Rule = {
  id: "low-content-volume",
  description: `Aponta Datasets com menos de ${MIN_CONTENTS_PER_DATASET} Contents.`,
  evaluate({ datasets, contents, metrics }): Insight[] {
    return datasets.flatMap((dataset) => {
      if (isAudienceDataset(dataset, metrics)) return [];
      if (isCampaignDataset(dataset, metrics)) return [];

      const count = contents.filter((content) => content.dataset_id === dataset.id).length;
      if (count >= MIN_CONTENTS_PER_DATASET) return [];

      const platformLabel = PLATFORM_LABELS[dataset.platform] ?? dataset.platform;

      return [
        {
          id: `low-content-volume:${dataset.id}`,
          ruleId: "low-content-volume",
          severity: "info",
          title: "Pouco conteúdo associado",
          message: `${platformLabel} tem só ${count} conteúdo(s) importado(s) até agora — os números ainda podem não ser representativos.`,
        },
      ];
    });
  },
};
