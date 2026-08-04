import type { ImportPlatform } from "@/lib/intelligence/imports/types";

/**
 * Plataformas com persistência implementada (`docs/intelligence/IMPORTS.md`,
 * seção "Estado por plataforma") — consumida pelo critério "persistence" da
 * Validação da Import Session (`session/validation.ts`, verifica "consigo
 * confirmar o Importar de verdade para esta plataforma?"). Cresce quando um
 * novo adapter ganha seu `persistence.ts` — desde a Sprint 14, YouTube e
 * Instagram (audiência, `platforms/instagram/persistence.ts`, ver
 * `docs/intelligence/AUDIENCE_PERSISTENCE.md`).
 *
 * Deliberadamente separado de "a Detection Preview reconhece esta
 * plataforma" — o Instagram Reels ou o TikTok, por exemplo, podem ganhar
 * Detection Preview antes de ganhar persistência, como o Instagram/audiência
 * teve entre as Sprints 13 e 14.
 *
 * A regra de Insight "Plataforma sem Dataset"
 * (`insights/rules/platformWithoutDataset.ts`) mantém sua própria lista
 * equivalente — deliberadamente não unificada com esta (o Rules Engine está
 * fora do escopo desta sprint). As duas listas precisam ser atualizadas
 * juntas quando um novo `persistence.ts` for implementado.
 */
export const PLATFORMS_WITH_PERSISTENCE: readonly ImportPlatform[] = ["youtube", "instagram", "tiktok"];
