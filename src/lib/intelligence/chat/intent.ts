import type { IntelligenceChatContextItem } from "@/lib/intelligence/chat/types";

/**
 * "Identificação de intenção" (Sprint 23, item 3 do escopo) — deliberadamente
 * não é um agente nem um classificador de IA: é uma pontuação determinística
 * por sobreposição de palavras entre a pergunta e cada item de contexto já
 * calculado (Question/Insight/Decision). Mesmo estilo de todo o resto do
 * Intelligence (regras puras, sem IA) — só a resposta final passa pelo LLM.
 */

const STOPWORDS = new Set([
  "a", "o", "os", "as", "um", "uma", "uns", "umas",
  "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas",
  "por", "para", "com", "sem", "sobre", "entre", "e", "ou", "que",
  "qual", "quais", "quando", "onde", "como", "quanto", "quantos", "quantas",
  "é", "foi", "são", "está", "estão", "ser", "tem", "têm", "há",
  "me", "meu", "minha", "meus", "minhas", "seu", "sua", "seus", "suas",
  "eu", "voce", "você", "nos", "quero", "gostaria", "pode", "poderia",
  "diga", "fale", "mostre", "mostra", "traga", "dê", "mais", "menos",
  "esse", "essa", "esses", "essas", "este", "esta", "estes", "estas", "isso",
]);

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

interface ScoredItem {
  item: IntelligenceChatContextItem;
  score: number;
}

/** Prioridade de fallback quando a pergunta não bate com nada específico — Decisions são a síntese mais acionável. */
const KIND_PRIORITY: Record<IntelligenceChatContextItem["kind"], number> = {
  decision: 3,
  insight: 2,
  question: 1,
};

const DEFAULT_MAX_ITEMS = 6;

/**
 * Seleciona o subconjunto de itens de contexto relevante para a pergunta —
 * nunca todos (manteria o prompt gigante e ruidoso), nunca nenhum (o LLM
 * ficaria sem nada para responder). Quando nenhum item tem sobreposição de
 * palavras com a pergunta (pergunta genérica, tipo "como estamos?"), cai
 * para os itens mais "acionáveis" (Decisions primeiro) como resumo geral.
 */
export function selectRelevantContext(
  question: string,
  items: IntelligenceChatContextItem[],
  maxItems: number = DEFAULT_MAX_ITEMS
): IntelligenceChatContextItem[] {
  const queryTokens = new Set(tokenize(question));

  const scored: ScoredItem[] = items.map((item) => {
    const itemTokens = tokenize(`${item.title} ${item.text}`);
    const score = itemTokens.reduce((total, token) => total + (queryTokens.has(token) ? 1 : 0), 0);
    return { item, score };
  });

  const matched = scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || KIND_PRIORITY[b.item.kind] - KIND_PRIORITY[a.item.kind]);

  if (matched.length > 0) {
    return matched.slice(0, maxItems).map((entry) => entry.item);
  }

  return [...items]
    .sort((a, b) => KIND_PRIORITY[b.kind] - KIND_PRIORITY[a.kind])
    .slice(0, maxItems);
}
