import { getBooks } from "@/lib/services/bookService";
import { listContents, listDatasets, listImports, listMetrics } from "@/lib/services/intelligenceDatasetService";
import { bestContentQuestion } from "@/lib/intelligence/questions/bestContent";
import { staleDatasetQuestion } from "@/lib/intelligence/questions/staleDataset";
import { unmatchedContentQuestion } from "@/lib/intelligence/questions/unmatchedContent";
import { runDecisionEngine } from "@/lib/intelligence/decisions";
import type { Decision } from "@/lib/intelligence/decisions";

/**
 * Ponto de entrada de I/O da Decision Engine (Sprint 11,
 * `docs/intelligence/DECISIONS_ENGINE.md`): busca os mesmos dados já
 * persistidos que o Dashboard e as Questions usam, reutilizando
 * exclusivamente os services existentes (`intelligenceDatasetService`,
 * `bookService`) — nenhuma consulta nova, nenhuma tabela nova. Calcula os
 * 3 `QuestionAnswer`s necessários (uma única vez, com os mesmos dados já
 * buscados) e delega as Decisions para `runDecisionEngine`, que só enxerga
 * QuestionAnswer, nunca os registros brutos buscados aqui.
 */
export async function getRecommendedDecisions(): Promise<Decision[]> {
  const [datasets, imports, contents, metrics, books] = await Promise.all([
    listDatasets(),
    listImports(),
    listContents(),
    listMetrics(),
    getBooks(),
  ]);

  const now = new Date();

  return runDecisionEngine({
    now,
    bestContent: bestContentQuestion.answer({
      now,
      datasets: datasets ?? [],
      contents: contents ?? [],
      metrics: metrics ?? [],
      books: books ?? [],
    }),
    staleDataset: staleDatasetQuestion.answer({ now, datasets: datasets ?? [], imports: imports ?? [] }),
    unmatchedContent: unmatchedContentQuestion.answer({ now, contents: contents ?? [] }),
  });
}
