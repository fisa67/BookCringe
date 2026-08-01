/** Dias completos entre duas datas — usado por regras baseadas em recência. */
export function daysBetween(from: Date, to: Date): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / millisecondsPerDay);
}

export function mostRecentByStartedAt<T extends { started_at: string }>(rows: T[]): T | undefined {
  return [...rows].sort((a, b) => b.started_at.localeCompare(a.started_at))[0];
}
