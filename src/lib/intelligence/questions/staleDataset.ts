import type { IntelligenceDatasetRecord, IntelligenceImportRecord } from "@/lib/types/intelligence";
import type { ImportPlatform } from "@/lib/intelligence/imports/types";
import type { Question } from "@/lib/intelligence/questions/types";

/**
 * Segunda pergunta do Épico Questions: "Qual é o Dataset mais
 * desatualizado?" — introduzida na Sprint 11 para alimentar a Decision
 * Engine (`lib/intelligence/decisions/`, `docs/intelligence/DECISIONS_ENGINE.md`).
 *
 * Só reporta o fato (há quantos dias o Dataset mais parado não recebe um
 * Import), sem aplicar nenhum limiar de "isso já é grave" — decidir se
 * aquilo justifica uma recomendação é responsabilidade de quem consome a
 * resposta (a Decision Engine usa o mesmo limiar já validado pelos
 * Insights, `STALE_DATASET_THRESHOLD_DAYS`, reexportado por
 * `lib/intelligence/insights`).
 */

export interface StaleDatasetAnswerData {
  datasetId: string;
  datasetName: string;
  platform: ImportPlatform;
  daysSinceLastImport: number;
  lastImportAt: string;
}

export interface StaleDatasetQuestionContext {
  now: Date;
  datasets: IntelligenceDatasetRecord[];
  imports: IntelligenceImportRecord[];
}

/**
 * Cópia local pequena e deliberada de `daysBetween`/"import mais recente"
 * (mesma lógica de `insights/rules/dateUtils.ts` e `staleDataset.ts`, não
 * exportados do módulo). Mesma decisão já registrada em
 * `questions/bestContent.ts`: não importar de dentro de `insights/rules/`
 * (não é API pública do módulo) nem alterar `insights/` para exportar isso.
 */
function daysBetween(from: Date, to: Date): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / millisecondsPerDay);
}

function mostRecentImport(imports: IntelligenceImportRecord[]): IntelligenceImportRecord | undefined {
  return [...imports].sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
}

function formatSummary(data: StaleDatasetAnswerData | null): string {
  if (!data) {
    return "Nenhum Dataset tem um Import registrado ainda.";
  }

  return `O Dataset mais desatualizado é "${data.datasetName}", sem uma nova importação há ${data.daysSinceLastImport} dia(s).`;
}

export const staleDatasetQuestion: Question<StaleDatasetQuestionContext, StaleDatasetAnswerData> = {
  id: "stale-dataset",
  question: "Qual é o Dataset mais desatualizado?",
  answer(context) {
    let worst: { dataset: IntelligenceDatasetRecord; lastImport: IntelligenceImportRecord; days: number } | null =
      null;

    for (const dataset of context.datasets) {
      const datasetImports = context.imports.filter((importRow) => importRow.dataset_id === dataset.id);
      const lastImport = mostRecentImport(datasetImports);
      if (!lastImport) continue;

      const days = daysBetween(new Date(lastImport.started_at), context.now);
      if (!worst || days > worst.days) {
        worst = { dataset, lastImport, days };
      }
    }

    const data: StaleDatasetAnswerData | null = worst
      ? {
          datasetId: worst.dataset.id,
          datasetName: worst.dataset.name,
          platform: worst.dataset.platform,
          daysSinceLastImport: worst.days,
          lastImportAt: worst.lastImport.started_at,
        }
      : null;

    return {
      questionId: "stale-dataset",
      question: "Qual é o Dataset mais desatualizado?",
      answeredAt: context.now.toISOString(),
      hasAnswer: data !== null,
      data,
      summary: formatSummary(data),
    };
  },
};
