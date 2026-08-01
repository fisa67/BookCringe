import { normalizeDetectionText } from "@/lib/intelligence/imports/detection/utils";

/**
 * Padrão oficial de "colunas canônicas" do Intelligence — toda plataforma
 * (YouTube hoje; Instagram/TikTok/Meta Ads/Google Analytics quando chegar
 * a vez, ver `AGENTS.md`) define seu schema de colunas em um único
 * `platforms/<plataforma>/columns.ts`, usando este mesmo tipo. O detector
 * (`detection/canonicalColumnDetector.ts`) e o parser da plataforma
 * consomem exatamente o mesmo schema — nunca existem duas listas de
 * cabeçalhos por plataforma. Ver `docs/intelligence/IMPORTS.md` (seção
 * "Colunas canônicas") para o guia completo de como adicionar um idioma
 * ou uma plataforma nova seguindo este padrão.
 */
export interface CanonicalColumnSchema<TColumn extends string> {
  /**
   * Aliases conhecidos de cada coluna canônica, em todos os idiomas já
   * cadastrados (ex.: `videoTitle: ["Video title", "Título do vídeo",
   * "Título del video"]`). Suportar um idioma novo é só acrescentar uma
   * string aqui — nenhum outro arquivo deste módulo (detector, parser,
   * testes) precisa saber quais idiomas existem.
   */
  aliases: Record<TColumn, readonly string[]>;
  /** Colunas sem as quais o arquivo não é reconhecível/parseável nesta plataforma. */
  required: readonly TColumn[];
  /**
   * Colunas que, se ausentes, degradam graciosamente em vez de invalidar
   * o arquivo — cabe a cada parser decidir o que "degradar" significa
   * (ex.: o parser do YouTube usa 0 como valor padrão para uma métrica
   * cuja coluna não existe no export).
   */
  optional?: readonly TColumn[];
}

export interface ColumnMatch<TColumn extends string> {
  /** Índice de cada coluna canônica (obrigatória ou opcional) encontrada nos cabeçalhos informados. */
  indexes: ReadonlyMap<TColumn, number>;
  matchedRequired: readonly TColumn[];
  missingRequired: readonly TColumn[];
  matchedOptional: readonly TColumn[];
  missingOptional: readonly TColumn[];
}

function normalizeHeader(value: string): string {
  return normalizeDetectionText(value.trim());
}

/**
 * Resolve, para os cabeçalhos reais de um CSV, o índice de cada coluna de
 * `schema` (obrigatória ou opcional) — em qualquer ordem, com quantas
 * colunas extras/desconhecidas o arquivo tiver. A comparação é sempre por
 * **igualdade exata normalizada** (sem acento, minúscula, sem espaços nas
 * pontas) — nunca substring solta num texto único — o que garante duas
 * coisas ao mesmo tempo: (1) "Título do vídeo", "Video title" e "Título
 * del video" resolvem para a mesma coluna, e (2) uma palavra genérica de
 * outra plataforma (ex.: "Views" de uma coluna chamada "Video views") não
 * é reconhecida por engano.
 *
 * Usada tanto pelo parser da plataforma (para ler os valores certos de
 * cada linha) quanto pelo detector (`canonicalColumnDetector.ts`, para
 * pontuar a confiança pela quantidade de colunas encontradas) — é a única
 * função que entende cabeçalho, garantindo que os dois nunca divirjam.
 */
export function matchColumns<TColumn extends string>(
  schema: CanonicalColumnSchema<TColumn>,
  headers: readonly string[]
): ColumnMatch<TColumn> {
  const normalizedHeaders = headers.map(normalizeHeader);
  const indexes = new Map<TColumn, number>();

  function findColumnIndex(column: TColumn): number {
    const normalizedAliases = schema.aliases[column].map(normalizeHeader);
    return normalizedHeaders.findIndex((header) => normalizedAliases.includes(header));
  }

  function matchAgainst(columns: readonly TColumn[]): { matched: TColumn[]; missing: TColumn[] } {
    const matched: TColumn[] = [];
    const missing: TColumn[] = [];

    for (const column of columns) {
      const index = findColumnIndex(column);
      if (index === -1) {
        missing.push(column);
      } else {
        indexes.set(column, index);
        matched.push(column);
      }
    }

    return { matched, missing };
  }

  const { matched: matchedRequired, missing: missingRequired } = matchAgainst(schema.required);
  const { matched: matchedOptional, missing: missingOptional } = matchAgainst(schema.optional ?? []);

  return { indexes, matchedRequired, missingRequired, matchedOptional, missingOptional };
}

/**
 * Valor (já sem espaços nas pontas) da coluna canônica `column` na linha
 * `row`, ou `undefined` se essa coluna não foi encontrada nos cabeçalhos
 * (distinção importante para colunas opcionais: "coluna ausente" e
 * "coluna presente com célula vazia" podem exigir tratamentos diferentes
 * — ver `platforms/youtube/parser.ts`).
 */
export function getColumnValue<TColumn extends string>(
  row: readonly string[],
  match: ColumnMatch<TColumn>,
  column: TColumn
): string | undefined {
  const index = match.indexes.get(column);
  if (index === undefined) return undefined;
  return row[index]?.trim();
}
