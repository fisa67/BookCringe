/**
 * Conversão entre o formato de entrada humana (`HH:MM:SS`, usada para
 * digitar o tempo total de leitura mostrado pelo Bookly) e segundos
 * (formato persistido em `book_readings.reading_time_seconds`, coluna
 * `bigint` no Postgres).
 *
 * `HH` aceita qualquer quantidade de dígitos (sem limite de 24h — tempo
 * total de leitura de um livro pode superar um dia). `MM` e `SS` devem
 * ser 0–59, com exatamente 2 dígitos.
 */

const HH_MM_SS_PATTERN = /^(\d+):([0-5]\d):([0-5]\d)$/;

/**
 * Converte uma string `HH:MM:SS` para o total em segundos.
 * Retorna `null` se `value` for vazio/ausente ou não casar com o formato
 * esperado — nunca lança, para que chamadores decidam como tratar entrada
 * inválida (ex.: erro de validação no formulário/API).
 */
export function parseHhMmSsToSeconds(value?: string | null): number | null {
  if (!value) return null;

  const match = HH_MM_SS_PATTERN.exec(value.trim());
  if (!match) return null;

  const [, hours, minutes, seconds] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

/**
 * Converte um total em segundos para `HH:MM:SS` (horas sem zero à
 * esquerda, minutos e segundos com 2 dígitos) — usado para reexibir o
 * valor persistido em um formulário. Retorna `undefined` para entrada
 * ausente, negativa ou não finita, sem fabricar um valor.
 */
export function formatSecondsToHhMmSs(totalSeconds?: number | null): string | undefined {
  if (typeof totalSeconds !== "number" || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return undefined;
  }

  const whole = Math.floor(totalSeconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
