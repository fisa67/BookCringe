import {
  getActivePromotionalCampaign,
  type CmsPromotionalCampaignWithItems,
} from "@/lib/services/promotionalCampaignService";

function isSafeUrl(value: string, allowRelative = false): boolean {
  if (allowRelative && value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function getPublicPromotionalCampaign(): Promise<CmsPromotionalCampaignWithItems | null> {
  const campaign = await getActivePromotionalCampaign();
  if (!campaign) return null;

  return {
    ...campaign,
    banner_url:
      campaign.banner_url && isSafeUrl(campaign.banner_url, true) ? campaign.banner_url : null,
    items: campaign.items.filter(
      (item) =>
        item.is_active &&
        isSafeUrl(item.image_url, true) &&
        isSafeUrl(item.affiliate_url)
    ),
  };
}
