import { getActivePromotionalCampaign } from "@/lib/services/promotionalCampaignService";
import { getBooks } from "@/lib/services/bookService";
import { getSettings } from "@/lib/services/settingsService";
import { resolveCampaignItem, type ResolvedCampaignItem } from "@/lib/campaigns";

export interface PublicPromotionalCampaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  is_active: boolean;
  items: ResolvedCampaignItem[];
}

function isSafeUrl(value: string, allowRelative = false): boolean {
  if (allowRelative && value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Campanha ativa para a página pública `/ofertas`. Cada item é resolvido
 * via `resolveCampaignItem` — itens vinculados a um livro nunca duplicam
 * capa/título/autor/link afiliado (vêm da Biblioteca, com a tag de afiliado
 * já aplicada via `resolveAmazonPurchaseUrl`); itens manuais usam seus
 * próprios campos. Itens órfãos (livro removido da Biblioteca) e itens
 * inativos/com URLs inseguras são descartados aqui mesmo, antes de chegar
 * na UI.
 */
export async function getPublicPromotionalCampaign(): Promise<PublicPromotionalCampaign | null> {
  const campaign = await getActivePromotionalCampaign();
  if (!campaign) return null;

  const [books, settings] = await Promise.all([getBooks(), getSettings()]);
  const booksById = new Map((books ?? []).map((book) => [book.id, book]));

  const items = campaign.items
    .filter((item) => item.is_active)
    .map((item) => resolveCampaignItem(item, booksById, settings?.amazon_associate_id))
    .filter((item): item is ResolvedCampaignItem => item !== null)
    .filter((item) => isSafeUrl(item.imageUrl ?? "", true) && isSafeUrl(item.affiliateUrl ?? ""));

  return {
    id: campaign.id,
    name: campaign.name,
    slug: campaign.slug,
    description: campaign.description,
    banner_url: campaign.banner_url && isSafeUrl(campaign.banner_url, true) ? campaign.banner_url : null,
    is_active: campaign.is_active,
    items,
  };
}
