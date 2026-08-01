import type { CmsBookRecord, CmsPromotionalCampaignItemRecord, PromotionalCampaignItemType } from "@/lib/types/cms";
import { resolveAmazonPurchaseUrl } from "@/lib/services/affiliateService";

/**
 * Item de campanha já resolvido para exibição — combina o item "cru"
 * (`CmsPromotionalCampaignItemRecord`) com o livro relacionado, quando
 * houver. Nenhum componente (admin ou público) deveria ler `title`/
 * `image_url`/`affiliate_url` direto do registro cru: para itens
 * vinculados a um livro, esses campos são sempre `null` na tabela (ver
 * `CmsPromotionalCampaignItemRecord`) — a única fonte de exibição correta é
 * este resolvedor.
 */
export interface ResolvedCampaignItem {
  id: string;
  campaignId: string;
  bookId: string | null;
  /** Path público do livro (`/livro/[slug]`) — só quando `bookId` está presente. */
  bookHref: string | null;
  title: string;
  imageUrl: string | null;
  description: string | null;
  affiliateUrl: string | null;
  price: number | null;
  position: number;
  isActive: boolean;
  itemType: PromotionalCampaignItemType;
}

/**
 * Resolve um item de campanha para exibição, dado o mapa de livros já
 * carregado (`Map<bookId, CmsBookRecord>` — mesma técnica de
 * `contentPublicAdapter.fetchPublishedContentsWithBooks`, uma única busca
 * de `books` reaproveitada por todos os itens da campanha).
 *
 * Retorna `null` quando o item está vinculado a um `book_id` que não foi
 * encontrado no mapa — livro removido da Biblioteca (órfão real), mesmo
 * critério usado por `contentPublicAdapter` para descartar conteúdo órfão.
 *
 * `associateId` (`settings.amazon_associate_id`) só se aplica a itens
 * vinculados a um livro — itens manuais já trazem o link afiliado pronto,
 * digitado pelo admin.
 */
export function resolveCampaignItem(
  item: CmsPromotionalCampaignItemRecord,
  booksById: Map<string, CmsBookRecord>,
  associateId?: string | null
): ResolvedCampaignItem | null {
  if (item.book_id) {
    const book = booksById.get(item.book_id);
    if (!book) return null;

    return {
      id: item.id,
      campaignId: item.campaign_id,
      bookId: book.id,
      bookHref: `/livro/${book.slug}`,
      title: book.title,
      imageUrl: book.cover_path ?? null,
      description: null,
      affiliateUrl: resolveAmazonPurchaseUrl(book.amazon_url, associateId) ?? null,
      price: item.price,
      position: item.position,
      isActive: item.is_active,
      itemType: item.item_type,
    };
  }

  return {
    id: item.id,
    campaignId: item.campaign_id,
    bookId: null,
    bookHref: null,
    title: item.title ?? "",
    imageUrl: item.image_url,
    description: item.description,
    affiliateUrl: item.affiliate_url,
    price: item.price,
    position: item.position,
    isActive: item.is_active,
    itemType: item.item_type,
  };
}
