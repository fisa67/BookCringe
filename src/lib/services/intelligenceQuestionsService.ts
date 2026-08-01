import { getBooks } from "@/lib/services/bookService";
import { listContents, listDatasets, listImports, listMetrics } from "@/lib/services/intelligenceDatasetService";
import { bestContentQuestion } from "@/lib/intelligence/questions/bestContent";
import type { BestContentAnswerData } from "@/lib/intelligence/questions/bestContent";
import { staleDatasetQuestion } from "@/lib/intelligence/questions/staleDataset";
import type { StaleDatasetAnswerData } from "@/lib/intelligence/questions/staleDataset";
import { unmatchedContentQuestion } from "@/lib/intelligence/questions/unmatchedContent";
import type { UnmatchedContentAnswerData } from "@/lib/intelligence/questions/unmatchedContent";
import type { QuestionAnswer } from "@/lib/intelligence/questions/types";

/**
 * Ponto de entrada de I/O do Épico Questions (Sprint 10,
 * `docs/intelligence/QUESTIONS.md`): busca os mesmos dados já persistidos
 * que o Dashboard usa, reutilizando exclusivamente os services existentes
 * (`intelligenceDatasetService`, `bookService`) — nenhuma consulta nova,
 * nenhuma tabela nova — e delega a resposta a uma Question pura
 * (`lib/intelligence/questions/`).
 *
 * Pensado para ser chamado por qualquer consumidor futuro (Dashboard, área
 * de IA em `/admin/intelligence/ia`, ou uma API) sem que nenhum deles
 * precise saber como o dado é buscado — mesma divisão de responsabilidade
 * já usada por `intelligenceDashboardService.ts`.
 */
export async function getBestContentAnswer(): Promise<QuestionAnswer<BestContentAnswerData>> {
  const [datasets, contents, metrics, books] = await Promise.all([
    listDatasets(),
    listContents(),
    listMetrics(),
    getBooks(),
  ]);

  return bestContentQuestion.answer({
    now: new Date(),
    datasets: datasets ?? [],
    contents: contents ?? [],
    metrics: metrics ?? [],
    books: books ?? [],
  });
}

/** Mesma ideia de `getBestContentAnswer`, para a pergunta "Qual é o Dataset mais desatualizado?" (Sprint 11). */
export async function getStaleDatasetAnswer(): Promise<QuestionAnswer<StaleDatasetAnswerData>> {
  const [datasets, imports] = await Promise.all([listDatasets(), listImports()]);

  return staleDatasetQuestion.answer({ now: new Date(), datasets: datasets ?? [], imports: imports ?? [] });
}

/** Mesma ideia de `getBestContentAnswer`, para a pergunta "Quanto do meu conteúdo ainda não foi vinculado a um Livro?" (Sprint 11). */
export async function getUnmatchedContentAnswer(): Promise<QuestionAnswer<UnmatchedContentAnswerData>> {
  const contents = await listContents();

  return unmatchedContentQuestion.answer({ now: new Date(), contents: contents ?? [] });
}
