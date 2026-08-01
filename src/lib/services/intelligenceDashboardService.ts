import { getBooks } from "@/lib/services/bookService";
import { listContents, listDatasets, listImports, listMetrics } from "@/lib/services/intelligenceDatasetService";
import { buildIntelligenceDashboardData } from "@/lib/intelligence/dashboard/summary";
import type { IntelligenceDashboardData } from "@/lib/intelligence/dashboard/types";

/**
 * Único ponto de entrada do Dashboard do Intelligence (Sprint 8,
 * `docs/intelligence-dashboard.md`): busca tudo que existe hoje (Datasets,
 * Imports, Contents, Metrics via `intelligenceDatasetService`; Livros via
 * `bookService`, já usado pelo Matching) e delega a agregação para
 * `buildIntelligenceDashboardData` (pura, sem I/O) — que, desde a Sprint 9,
 * também roda o Rules Engine (`lib/intelligence/insights/`,
 * `docs/intelligence-insights.md`) sobre os mesmos dados, sem nenhuma
 * consulta adicional.
 *
 * A página `/admin/intelligence` chama só esta função — nunca o Supabase
 * diretamente, nunca SQL. Qualquer service que já existir é reaproveitado
 * sem alteração; nada aqui duplica uma consulta que já existe em outro
 * lugar do módulo.
 */
export async function getIntelligenceDashboardData(): Promise<IntelligenceDashboardData> {
  const [datasets, imports, contents, metrics, books] = await Promise.all([
    listDatasets(),
    listImports(),
    listContents(),
    listMetrics(),
    getBooks(),
  ]);

  return buildIntelligenceDashboardData({
    datasets: datasets ?? [],
    imports: imports ?? [],
    contents: contents ?? [],
    metrics: metrics ?? [],
    books: books ?? [],
  });
}
