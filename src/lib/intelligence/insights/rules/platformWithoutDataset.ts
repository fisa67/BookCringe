import type { ImportPlatform } from "@/lib/intelligence/imports/types";
import type { Insight, Rule } from "@/lib/intelligence/insights/types";
import { PLATFORM_LABELS } from "@/lib/intelligence/session";

/**
 * Plataformas com persistência implementada (`docs/intelligence.md`, seção
 * "Estado por plataforma") — a única lista que precisa crescer quando um
 * novo adapter ganhar seu `persistence.ts`. Desde a Sprint 14, YouTube e
 * Instagram (audiência) — mantida em espelho manual de
 * `imports/platformCapabilities.ts` (Rules Engine fora do escopo da unificação).
 */
export const PLATFORMS_WITH_PERSISTENCE: ImportPlatform[] = ["youtube", "instagram", "tiktok"];

/**
 * "Plataforma sem Dataset": diferente das demais regras (que olham para
 * Datasets/Contents existentes), esta olha para o que *deveria* existir —
 * plataformas já prontas para importar que ainda não têm nenhum dado.
 */
export const platformWithoutDatasetRule: Rule = {
  id: "platform-without-dataset",
  description: "Aponta plataformas com persistência pronta que ainda não têm nenhum Dataset.",
  evaluate({ datasets }): Insight[] {
    const existingPlatforms = new Set(datasets.map((dataset) => dataset.platform));

    return PLATFORMS_WITH_PERSISTENCE.filter((platform) => !existingPlatforms.has(platform)).map((platform) => ({
      id: `platform-without-dataset:${platform}`,
      ruleId: "platform-without-dataset",
      severity: "info" as const,
      title: "Plataforma sem Dataset",
      message: `${PLATFORM_LABELS[platform] ?? platform} já pode ser importado, mas nenhum dado foi trazido ainda.`,
    }));
  },
};
