import type { PromotionalCampaignItemType } from "@/lib/types/cms";

export const PROMOTIONAL_ITEM_TYPE_LABELS: Record<PromotionalCampaignItemType, string> = {
  book: "Livro",
  kindle: "Kindle",
  accessory: "Acessório",
  other: "Outro",
};

export const PROMOTIONAL_ITEM_TYPE_VALUES = Object.keys(
  PROMOTIONAL_ITEM_TYPE_LABELS
) as PromotionalCampaignItemType[];
