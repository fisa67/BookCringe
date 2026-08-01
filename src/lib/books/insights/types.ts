import type { CmsBookReadingRecord, CmsBookRecord } from "@/lib/types/cms";
import type { BookParticipationsSummary } from "@/lib/adapters/bookParticipationsAdapter";

/**
 * Rules Engine de "próximas ações sugeridas" da Biblioteca (Sprint 4 —
 * Biblioteca Inteligente). Mesmo padrão do Rules Engine do módulo
 * Intelligence (`src/lib/intelligence/insights/`) — regras puras,
 * independentes, computadas sob demanda a partir de dados já persistidos
 * (sem tabela, sem migration) — mas numa pasta própria, sem a palavra
 * "intelligence", para não confundir com aquele módulo (métricas de
 * plataformas externas): este aqui é sobre o domínio editorial do livro.
 */

export type BookInsightSeverity = "info" | "success" | "warning";

export interface BookInsight {
  /** Único por instância (regra + livro) — usado como `key` na UI. */
  id: string;
  ruleId: string;
  severity: BookInsightSeverity;
  title: string;
  message: string;
  /** Quando presentes, viram um botão de "próxima ação"; sem eles, o insight é só informativo. */
  actionLabel?: string;
  actionHref?: string;
  /** Abre `actionHref` numa nova aba — só para links do site público (ex.: `/livro/[slug]`). */
  actionExternal?: boolean;
}

/**
 * Tudo que uma regra pode precisar para avaliar — sempre dados já
 * calculados por `bookParticipationsAdapter`, nunca uma query própria.
 * `now` é injetável de propósito (mesmo motivo do Intelligence): nenhuma
 * regra deve chamar `new Date()` diretamente, para continuar determinística
 * em teste.
 */
export interface BookInsightContext {
  now: Date;
  book: Pick<CmsBookRecord, "id" | "slug">;
  reading: Pick<
    CmsBookReadingRecord,
    "rating" | "favorite" | "would_recommend" | "status" | "finished_at"
  > | null;
  participations: BookParticipationsSummary;
}

/**
 * Uma regra do Rules Engine: isolada (um arquivo, uma responsabilidade),
 * testável (`evaluate` é uma função pura, sem I/O) e reutilizável.
 */
export interface BookInsightRule {
  id: string;
  description: string;
  evaluate(context: BookInsightContext): BookInsight[];
}
