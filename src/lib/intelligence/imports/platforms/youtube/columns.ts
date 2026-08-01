import type { CanonicalColumnSchema } from "@/lib/intelligence/imports/columns";

/**
 * Colunas canônicas do relatório do YouTube Studio — a fonte única de
 * verdade consumida por `detection/platformDetectors.ts` (detector) e
 * `parser.ts` (parser). Ver `docs/intelligence/IMPORTS.md` para o guia
 * completo do padrão "colunas canônicas" e como replicá-lo para outra
 * plataforma.
 */
export type YouTubeCanonicalColumn =
  | "videoTitle"
  | "videoPublishTime"
  | "views"
  | "watchTimeHours"
  | "impressions"
  | "subscribers";

/**
 * Aliases conhecidos de cada coluna, por idioma da conta do YouTube
 * Studio. Suportar um idioma novo é só acrescentar uma string num destes
 * arrays — nenhum outro arquivo (detector, parser, testes) precisa saber
 * quais idiomas existem.
 */
const ALIASES: Record<YouTubeCanonicalColumn, readonly string[]> = {
  videoTitle: ["Video title", "Título do vídeo", "Título del video"],
  videoPublishTime: [
    "Video publish time",
    "Horário de publicação do vídeo",
    "Hora de publicación del video",
  ],
  views: ["Views", "Visualizações", "Vistas"],
  watchTimeHours: [
    "Watch time (hours)",
    "Tempo de exibição (horas)",
    "Tiempo de visualización (horas)",
  ],
  impressions: ["Impressions", "Impressões", "Impresiones"],
  subscribers: ["Subscribers", "Inscritos", "Suscriptores"],
};

/**
 * `videoTitle` e `videoPublishTime` são a identidade de uma linha — sem
 * elas não há como saber a qual vídeo aquela linha se refere. É por isso
 * que o parser reconhece e ignora silenciosamente a linha "Total"
 * agregada do `Table data.csv`: ela não preenche essas duas colunas.
 *
 * As 4 métricas são opcionais de propósito: se uma exportação futura do
 * YouTube Studio vier sem, por exemplo, "Subscribers" (porque a pessoa
 * desmarcou essa métrica na hora de exportar, ou uma versão futura do
 * Studio renomeou/removeu a coluna), a importação continua funcionando
 * — a métrica ausente entra como 0, em vez de o arquivo inteiro ser
 * rejeitado.
 */
export const YOUTUBE_COLUMN_SCHEMA: CanonicalColumnSchema<YouTubeCanonicalColumn> = {
  aliases: ALIASES,
  required: ["videoTitle", "videoPublishTime"],
  optional: ["views", "watchTimeHours", "impressions", "subscribers"],
};
