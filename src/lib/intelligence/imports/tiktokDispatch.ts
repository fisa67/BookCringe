import type {
  ImportPlatform,
  TikTokDatasetKind,
} from "@/lib/intelligence/imports/types";

export type TikTokImportDispatch = "tiktok_promotions" | "unsupported";

/**
 * Ponto único de decisão para formatos TikTok. Detection, Preview e Confirm
 * compartilham o mesmo discriminador; somente Promotions possui adapter.
 */
export function dispatchTikTokImport(target: {
  platform: ImportPlatform;
  datasetKind?: TikTokDatasetKind;
}): TikTokImportDispatch | null {
  if (target.platform !== "tiktok") return null;
  return target.datasetKind === "tiktok_promotions"
    ? "tiktok_promotions"
    : "unsupported";
}
