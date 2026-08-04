/**
 * Mesma conversão de número que `platforms/youtube/parser.ts#parseNumber`
 * (tolera espaço e vírgula decimal) — copiada aqui, não importada de lá:
 * cada plataforma tem sua própria cópia pequena e deliberada, nunca um
 * parser de número compartilhado entre plataformas (`docs/intelligence/IMPORTS.md`).
 */
export function parseAudienceNumber(value: string | undefined): number | null {
  if (value === undefined) return null;

  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
