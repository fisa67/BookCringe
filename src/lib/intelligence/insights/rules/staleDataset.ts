import type { Insight, Rule } from "@/lib/intelligence/insights/types";
import { daysBetween, mostRecentByStartedAt } from "@/lib/intelligence/insights/rules/dateUtils";
import { PLATFORM_LABELS } from "@/lib/intelligence/session";

/** Acima de quantos dias sem um novo Import um Dataset é considerado desatualizado. */
export const STALE_DATASET_THRESHOLD_DAYS = 30;

/**
 * "Dataset desatualizado": cada Dataset tem seu próprio relógio — um
 * Dataset pode estar parado mesmo que outra plataforma tenha sido
 * importada recentemente (essa visão global é a regra `no-recent-import`).
 */
export const staleDatasetRule: Rule = {
  id: "stale-dataset",
  description: `Aponta Datasets cujo Import mais recente tem mais de ${STALE_DATASET_THRESHOLD_DAYS} dias.`,
  evaluate({ now, datasets, imports }): Insight[] {
    return datasets.flatMap((dataset) => {
      const latest = mostRecentByStartedAt(imports.filter((importRow) => importRow.dataset_id === dataset.id));
      if (!latest) return [];

      const daysSinceLastImport = daysBetween(new Date(latest.started_at), now);
      if (daysSinceLastImport < STALE_DATASET_THRESHOLD_DAYS) return [];

      const platformLabel = PLATFORM_LABELS[dataset.platform] ?? dataset.platform;

      return [
        {
          id: `stale-dataset:${dataset.id}`,
          ruleId: "stale-dataset",
          severity: "warning",
          title: "Dataset desatualizado",
          message: `${platformLabel} não recebe uma importação há ${daysSinceLastImport} dias. Considere importar um relatório mais recente.`,
        },
      ];
    });
  },
};
