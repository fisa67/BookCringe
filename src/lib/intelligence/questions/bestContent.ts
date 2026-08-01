import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import type { CmsBookRecord } from "@/lib/types/cms";
import type { ImportPlatform } from "@/lib/intelligence/imports/types";
import { PLATFORM_LABELS } from "@/lib/intelligence/session";
import type { Question } from "@/lib/intelligence/questions/types";

/**
 * Primeira pergunta do Épico Questions (Sprint 10): "Qual foi meu melhor
 * conteúdo?"
 *
 * "Melhor" usa a mesma definição já consolidada pelo Top 10 do Dashboard
 * (`dashboard/summary.ts`, Sprint 8): a leitura mais recente de `views` por
 * Content. Manter a mesma métrica/critério evita duas respostas diferentes
 * para "o que performou melhor" dentro do Intelligence. Metrics são
 * imutáveis — cada Import insere uma linha nova — então a leitura mais
 * recente já é o total reportado pela plataforma, nunca uma soma.
 */
export const BEST_CONTENT_METRIC_KEY = "views";

export interface BestContentAnswerData {
  contentId: string;
  title: string;
  platform: ImportPlatform;
  datasetName: string;
  /** Sempre `BEST_CONTENT_METRIC_KEY` hoje — exposto para o consumidor nunca precisar de um valor mágico. */
  metric: string;
  value: number;
  measuredAt: string;
  /** Preenchido só quando o Content já foi associado a um Livro (Matching, Sprint 7). */
  bookTitle?: string;
  publishedAt?: string;
}

export interface BestContentQuestionContext {
  now: Date;
  datasets: IntelligenceDatasetRecord[];
  contents: IntelligenceContentRecord[];
  metrics: IntelligenceMetricRecord[];
  books: CmsBookRecord[];
}

/**
 * Cópia local, pequena e deliberada da mesma lógica usada por
 * `dashboard/summary.ts#latestMetricValueByContent` (não exportada de lá).
 * A arquitetura v0.1 está congelada — esta sprint não deve tocar no módulo
 * `dashboard/`, mesmo para extrair um helper de ~10 linhas. Se um terceiro
 * consumidor precisar do mesmo cálculo, a extração para
 * `lib/intelligence/shared/` (já reservado na Architecture Freeze) é
 * trabalho de uma sprint própria, não desta.
 */
function latestMetricValueByContent(
  metrics: IntelligenceMetricRecord[],
  key: string
): Map<string, { value: number; measuredAt: string }> {
  const latest = new Map<string, { value: number; measuredAt: string }>();

  for (const metric of metrics) {
    if (metric.key !== key || !metric.content_id) continue;

    const current = latest.get(metric.content_id);
    if (!current || metric.measured_at > current.measuredAt) {
      latest.set(metric.content_id, { value: metric.value, measuredAt: metric.measured_at });
    }
  }

  return latest;
}

function formatSummary(data: BestContentAnswerData | null): string {
  if (!data) {
    return "Ainda não há conteúdo com métricas suficientes para responder essa pergunta.";
  }

  const platformLabel = PLATFORM_LABELS[data.platform] ?? data.platform;
  const bookSuffix = data.bookTitle ? `, sobre o livro "${data.bookTitle}"` : "";
  const formattedValue = data.value.toLocaleString("pt-BR");

  return `Seu melhor conteúdo foi "${data.title}" (${platformLabel})${bookSuffix}, com ${formattedValue} de ${data.metric}.`;
}

export const bestContentQuestion: Question<BestContentQuestionContext, BestContentAnswerData> = {
  id: "best-content",
  question: "Qual foi meu melhor conteúdo?",
  answer(context) {
    const datasetById = new Map(context.datasets.map((dataset) => [dataset.id, dataset]));
    const bookById = new Map(context.books.map((book) => [book.id, book]));
    const latestByContent = latestMetricValueByContent(context.metrics, BEST_CONTENT_METRIC_KEY);

    let best: { content: IntelligenceContentRecord; value: number; measuredAt: string } | null = null;

    for (const content of context.contents) {
      const entry = latestByContent.get(content.id);
      if (!entry) continue;
      if (!best || entry.value > best.value) {
        best = { content, value: entry.value, measuredAt: entry.measuredAt };
      }
    }

    const data: BestContentAnswerData | null = best
      ? {
          contentId: best.content.id,
          title: best.content.title,
          platform: datasetById.get(best.content.dataset_id)?.platform ?? "unknown",
          datasetName: datasetById.get(best.content.dataset_id)?.name ?? "Dataset removido",
          metric: BEST_CONTENT_METRIC_KEY,
          value: best.value,
          measuredAt: best.measuredAt,
          bookTitle: best.content.book_id ? bookById.get(best.content.book_id)?.title : undefined,
          publishedAt: best.content.published_at,
        }
      : null;

    return {
      questionId: "best-content",
      question: "Qual foi meu melhor conteúdo?",
      answeredAt: context.now.toISOString(),
      hasAnswer: data !== null,
      data,
      summary: formatSummary(data),
    };
  },
};
