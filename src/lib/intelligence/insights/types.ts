import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceImportRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

/**
 * Rules Engine do Intelligence (Sprint 9, `docs/intelligence-insights.md`):
 * inteligência baseada em regras, não em IA/LLM. Produz `Insight`s
 * (`docs/data-model.md#insight`) com origem "regra" — computados sob
 * demanda a partir de dados já persistidos, nunca guardados (sem tabela,
 * sem migration).
 */

export type InsightSeverity = "info" | "warning" | "critical";

export interface Insight {
  /** Único por instância (regra + assunto, ex.: `stale-dataset:dataset-1`) — usado como `key` na UI. */
  id: string;
  ruleId: string;
  severity: InsightSeverity;
  title: string;
  message: string;
}

/**
 * Tudo que uma Rule pode precisar para avaliar — sempre dados já
 * persistidos (nunca arquivo, nunca uma nova consulta). `now` é
 * injetável de propósito: nenhuma regra deve chamar `new Date()`
 * diretamente, para continuar 100% determinística em teste.
 */
export interface RuleContext {
  now: Date;
  datasets: IntelligenceDatasetRecord[];
  imports: IntelligenceImportRecord[];
  contents: IntelligenceContentRecord[];
  metrics: IntelligenceMetricRecord[];
}

/**
 * Uma regra do Rules Engine: isolada (um arquivo, uma responsabilidade),
 * testável (`evaluate` é uma função pura, sem I/O) e reutilizável (não sabe
 * nada sobre o Dashboard — a mesma regra podia alimentar um e-mail semanal
 * ou um alerta, no futuro, sem alteração).
 */
export interface Rule {
  id: string;
  description: string;
  evaluate(context: RuleContext): Insight[];
}
