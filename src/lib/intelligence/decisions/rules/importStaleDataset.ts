import type { Decision, DecisionRule } from "@/lib/intelligence/decisions/types";
import { STALE_DATASET_THRESHOLD_DAYS } from "@/lib/intelligence/insights";
import { PLATFORM_LABELS } from "@/lib/intelligence/session";

/**
 * "Importe um novo relatório": lê exclusivamente o `QuestionAnswer` de
 * `staleDatasetQuestion` (`questions/staleDataset.ts`). Reusa o mesmo
 * limiar já validado pela Insight `stale-dataset`
 * (`STALE_DATASET_THRESHOLD_DAYS`, reexportado por
 * `lib/intelligence/insights`) para as duas camadas concordarem sobre o
 * que conta como "desatualizado" — evita duas respostas diferentes para a
 * mesma pergunta implícita.
 */
export const importStaleDatasetDecision: DecisionRule = {
  id: "import-stale-dataset",
  description: `Recomenda importar um novo relatório quando o Dataset mais desatualizado tem ${STALE_DATASET_THRESHOLD_DAYS} dias ou mais sem Import.`,
  evaluate({ staleDataset }): Decision[] {
    if (!staleDataset.hasAnswer || !staleDataset.data) return [];
    if (staleDataset.data.daysSinceLastImport < STALE_DATASET_THRESHOLD_DAYS) return [];

    const { data } = staleDataset;
    const platformLabel = PLATFORM_LABELS[data.platform] ?? data.platform;
    const priority = data.daysSinceLastImport >= STALE_DATASET_THRESHOLD_DAYS * 2 ? "high" : "medium";

    return [
      {
        id: "import-stale-dataset",
        title: "Importe um novo relatório",
        description: `O Dataset "${data.datasetName}" (${platformLabel}) não recebe uma nova importação há ${data.daysSinceLastImport} dias.`,
        priority,
        recommendedAction: `Abra o Import Center (/admin/intelligence/importacoes) e importe um relatório mais recente de ${platformLabel}.`,
        rationale: `Baseado na pergunta "${staleDataset.question}": ${staleDataset.summary}`,
      },
    ];
  },
};
