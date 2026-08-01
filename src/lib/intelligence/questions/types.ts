/**
 * Contrato genérico de uma "pergunta de negócio" do Intelligence (Épico
 * Questions, Sprint 10) — a biblioteca de perguntas reutilizáveis descrita
 * em `docs/intelligence/QUESTIONS.md`.
 *
 * Uma Question nunca faz I/O: recebe dados já buscados pelos services
 * existentes (mesmo padrão de `insights/types.ts#RuleContext`) e devolve um
 * objeto pronto para qualquer consumidor — Dashboard, área de IA
 * (`/admin/intelligence/ia`) ou uma futura API — nunca dado cru. Isso é o
 * que torna a pergunta reutilizável: quem chama nunca precisa saber como a
 * resposta foi calculada, só ler `summary`/`data`.
 */

export interface QuestionAnswer<TData> {
  /** Igual ao `id` da Question que gerou esta resposta. */
  questionId: string;
  /** A pergunta em linguagem natural, pronta para exibição. */
  question: string;
  /** Quando a resposta foi computada — sempre sob demanda, nunca persistida (mesma decisão já tomada para `Insight`, Sprint 9). */
  answeredAt: string;
  /** `false` quando não há dado suficiente para responder (ex.: nenhum Content com a métrica usada). */
  hasAnswer: boolean;
  /** Dado estruturado da resposta — `null` quando `hasAnswer` é `false`. Nunca é a linha crua de uma tabela. */
  data: TData | null;
  /** Resumo em linguagem natural da resposta — pronto para exibição direta (Dashboard) ou leitura por IA/API, sem interpretar `data`. */
  summary: string;
}

export interface Question<TContext, TData> {
  id: string;
  question: string;
  answer(context: TContext): QuestionAnswer<TData>;
}
