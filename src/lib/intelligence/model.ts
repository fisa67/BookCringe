import type { ImportPlatform } from "@/lib/intelligence/imports/types";

/**
 * Modelo canônico do Intelligence — entidades de negócio independentes de
 * qualquer plataforma de origem. Documentação conceitual completa
 * (finalidade, relacionamentos, exemplos, responsabilidades e o que NÃO
 * pertence a cada entidade) em `docs/data-model.md`; leia lá antes de mexer
 * aqui.
 *
 * Diferença para `imports/types.ts`: aqueles tipos descrevem o *processo* de
 * trazer um arquivo para dentro do sistema (detecção, parse, normalização) e
 * são efêmeros — vivem só durante uma execução do pipeline. Estes tipos
 * descrevem o que o sistema *sabe*, depois que os dados de qualquer
 * plataforma já foram adaptados para o formato comum.
 *
 * Ainda sem persistência: nenhum destes tipos tem tabela, migration ou
 * service por trás. São a base conceitual para a sprint de Persistência —
 * os campos abaixo tendem a crescer/ajustar quando o schema real for
 * desenhado, mas o significado de cada entidade não deve mudar.
 */

/** Uma origem externa de dados. Ver seção "Platform" em `docs/data-model.md`. */
export interface Platform {
  id: ImportPlatform;
  name: string;
}

/**
 * Coleção nomeada de dados de uma Platform, com formato estável ao longo do
 * tempo. Recebe sucessivos Imports. Ver seção "Dataset" em `docs/data-model.md`.
 */
export interface Dataset {
  id: string;
  platformId: ImportPlatform;
  name: string;
  description?: string;
}

/**
 * Um evento específico de importação de arquivo(s) para dentro de um
 * Dataset. Contraparte canônica/histórica do `ImportBatch` usado durante o
 * processamento em `imports/types.ts`. Ver seção "Import" em `docs/data-model.md`.
 */
export interface Import {
  id: string;
  datasetId: string;
  status: "pending" | "processing" | "completed" | "failed";
  /** Nome do arquivo original — parte do papel de auditoria do Import (ver "Responsabilidades" em `docs/data-model.md`). */
  fileName: string;
  startedAt: string;
  finishedAt?: string;
  acceptedRecords: number;
  rejectedRecords: number;
}

/**
 * Uma peça de conteúdo do BookCringe sobre a qual existem métricas (vídeo,
 * reel, campanha, página). Não confundir com `CmsContentRecord`
 * (`src/lib/types/cms.ts`) — conceitos vizinhos, não equivalentes; ver seção
 * "Content" em `docs/data-model.md`.
 */
export interface Content {
  id: string;
  datasetId: string;
  title: string;
  externalUrl?: string;
  publishedAt?: string;
  /**
   * Referência (só o id) para um Livro do CMS — matching assistido, nunca
   * automático, nunca uma cópia de dados do Livro. Ver
   * `docs/content-matching.md`. Ausente até o Content ser associado
   * manualmente a um Livro.
   */
  bookId?: string;
}

/**
 * Um fato numérico normalizado. Associada a um Content quando existe um item
 * específico sendo medido; quando o dado é do nível do próprio Dataset
 * (ex.: métricas agregadas de audiência), `contentId` fica ausente. Ver
 * seção "Metric" em `docs/data-model.md`.
 */
export interface Metric {
  id: string;
  datasetId: string;
  importId: string;
  contentId?: string;
  key: string;
  value: number;
  unit?: string;
  measuredAt: string;
}

/**
 * Interpretação derivada de uma ou mais Metrics — manual ou gerada por IA.
 * Ver seção "Insight" em `docs/data-model.md`.
 */
export interface Insight {
  id: string;
  relatedMetricIds: string[];
  summary: string;
  generatedAt: string;
  source: "manual" | "ai";
}
