/**
 * Rótulos de mês em pt-BR para o admin do Clube de Leitura.
 *
 * Duplica a pequena lista já existente (privada) em `src/lib/bookclub.ts`
 * — não a importa para não acoplar o admin à lógica de calendário do site
 * público (baseada em `src/data/bookclub/`), que é um domínio separado.
 */
const MONTH_LABELS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function getMonthLabel(month: number): string {
  return MONTH_LABELS_PT[month - 1] ?? `Mês ${month}`;
}
