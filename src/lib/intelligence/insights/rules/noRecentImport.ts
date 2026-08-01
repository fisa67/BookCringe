import type { Insight, Rule } from "@/lib/intelligence/insights/types";
import { daysBetween, mostRecentByStartedAt } from "@/lib/intelligence/insights/rules/dateUtils";

/** Acima de quantos dias sem NENHUM Import (de qualquer plataforma) o Dashboard avisa. */
export const RECENT_IMPORT_THRESHOLD_DAYS = 14;

/**
 * "Nenhuma importação recente": diferente de `stale-dataset` (por
 * Dataset), esta é uma visão global — só dispara se NENHUMA plataforma
 * trouxe dado novo recentemente. Se ainda não existe nenhum Import, o
 * próprio Dashboard já mostra o estado vazio (Sprint 8); a regra não
 * duplica esse aviso.
 */
export const noRecentImportRule: Rule = {
  id: "no-recent-import",
  description: `Aponta quando nenhum Import, de nenhuma plataforma, aconteceu nos últimos ${RECENT_IMPORT_THRESHOLD_DAYS} dias.`,
  evaluate({ now, imports }): Insight[] {
    const latest = mostRecentByStartedAt(imports);
    if (!latest) return [];

    const daysSinceLastImport = daysBetween(new Date(latest.started_at), now);
    if (daysSinceLastImport < RECENT_IMPORT_THRESHOLD_DAYS) return [];

    return [
      {
        id: "no-recent-import",
        ruleId: "no-recent-import",
        severity: "warning",
        title: "Nenhuma importação recente",
        message: `A importação mais recente, de qualquer plataforma, foi há ${daysSinceLastImport} dias. Traga dados novos para manter o Dashboard atualizado.`,
      },
    ];
  },
};
