/**
 * As datas dos exports de audiência do Instagram (FollowerHistory,
 * FollowerActivity) vêm em pt-BR por extenso e SEM ano — ex.: "31 de
 * julho", "1 de janeiro". Isso é específico do formato desses dois
 * relatórios do Instagram, então este helper fica dentro do Adapter do
 * Instagram, não em `imports/columns.ts` (que é agnóstico de plataforma).
 *
 * A ordem das linhas nesses exports é cronológica ascendente e cobre até um
 * ano inteiro — ou seja, o mês "volta" (dezembro → janeiro) exatamente uma
 * vez no meio do arquivo. Resolvemos o ano andando de trás para frente:
 * ancoramos a ÚLTIMA linha (a mais recente) a uma `referenceDate` (por
 * padrão "agora", mas parametrizável — sobretudo para os testes fixarem
 * uma data e tornarem o resultado determinístico) e então, para cada par
 * de linhas adjacentes, decrementamos o ano sempre que o mês precisar
 * "voltar" para a transição ser cronologicamente válida.
 */

const PT_BR_MONTHS: Record<string, number> = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export interface DayMonth {
  day: number;
  month: number;
}

const DAY_MONTH_PATTERN = /^(\d{1,2})\s+de\s+([a-z]+)$/;

/** `null` quando `value` não bate com o padrão "<dia> de <mês>" em pt-BR. */
export function parsePtBrDayMonth(value: string): DayMonth | null {
  const match = DAY_MONTH_PATTERN.exec(normalize(value));
  if (!match) return null;

  const day = Number(match[1]);
  const month = PT_BR_MONTHS[match[2]];
  if (!month || day < 1 || day > 31) return null;

  return { day, month };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Resolve o ano de cada `entry` (assumindo ordem cronológica ascendente,
 * cobrindo no máximo ~1 ano, com no máximo uma virada dezembro→janeiro) e
 * devolve datas ISO (`YYYY-MM-DD`) na mesma ordem/quantidade de `entries`.
 *
 * A última entrada é ancorada ao ano de `referenceDate` — a menos que isso a
 * colocasse no futuro em relação a `referenceDate`, caso em que ela recua um
 * ano (ex.: hoje é 3 de agosto e a última linha é "5 de agosto": não pode
 * ser este ano ainda, então é do ano anterior).
 */
export function resolveYearForSequentialDates(
  entries: readonly DayMonth[],
  referenceDate: Date = new Date()
): string[] {
  if (entries.length === 0) return [];

  const refMonth = referenceDate.getMonth() + 1;
  const refDay = referenceDate.getDate();

  const years = new Array<number>(entries.length);
  const last = entries[entries.length - 1];
  const lastIsInFuture = last.month > refMonth || (last.month === refMonth && last.day > refDay);
  years[entries.length - 1] = referenceDate.getFullYear() - (lastIsInFuture ? 1 : 0);

  for (let index = entries.length - 2; index >= 0; index -= 1) {
    const current = entries[index];
    const next = entries[index + 1];
    // Indo de `current` para `next` (para frente no tempo): se o mês
    // "voltou" (ex.: 12 → 1), cruzamos uma virada de ano nesse trecho —
    // então `current` é do ano anterior ao de `next`.
    years[index] = years[index + 1] - (current.month > next.month ? 1 : 0);
  }

  return entries.map((entry, index) => `${years[index]}-${pad2(entry.month)}-${pad2(entry.day)}`);
}
