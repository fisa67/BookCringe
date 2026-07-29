const RICH_TEXT_TAG_PATTERN =
  /<(?:p|br|h2|h3|strong|em|ul|ol|li|blockquote|a|img)\b[^>]*>/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Campanhas antigas foram salvas como texto puro. O editor passa a salvar
 * HTML, mas esta detecção permite abrir e enviar o formato antigo sem
 * interpretar texto legado como markup.
 */
export function isNewsletterRichText(value: string): boolean {
  return RICH_TEXT_TAG_PATTERN.test(value);
}

/** Converte o formato legado em HTML seguro para o editor e o e-mail. */
export function plainTextToNewsletterHtml(value: string): string {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

/**
 * Conteúdo inicial do editor. Texto puro vira parágrafos preservando
 * quebras, emojis e o conteúdo original; HTML já salvo é mantido para a
 * sanitização no servidor antes de persistir/enviar.
 */
export function getNewsletterEditorContent(value?: string): string {
  if (!value) return "<p></p>";
  return isNewsletterRichText(value) ? value : plainTextToNewsletterHtml(value);
}
