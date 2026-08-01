import { describe, expect, it } from "vitest";
import { resolveCampaignItem } from "./campaigns";
import type { CmsBookRecord, CmsPromotionalCampaignItemRecord } from "@/lib/types/cms";

function makeBook(overrides: Partial<CmsBookRecord> = {}): CmsBookRecord {
  return {
    id: "book-1",
    slug: "quando",
    title: "Quando",
    author: "Carla Madeira",
    genres: [],
    metadata: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeItem(overrides: Partial<CmsPromotionalCampaignItemRecord> = {}): CmsPromotionalCampaignItemRecord {
  return {
    id: "item-1",
    campaign_id: "campaign-1",
    book_id: null,
    title: null,
    image_url: null,
    description: null,
    affiliate_url: null,
    price: null,
    position: 0,
    is_active: true,
    item_type: "other",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveCampaignItem", () => {
  it("resolve um item manual direto dos campos próprios (sem tocar em books)", () => {
    const item = makeItem({
      title: "Kindle Paperwhite",
      image_url: "/images/kindle.jpg",
      affiliate_url: "https://www.amazon.com.br/kindle",
      description: "Leve e compacto.",
      price: 599.9,
      item_type: "kindle",
    });

    const resolved = resolveCampaignItem(item, new Map());

    expect(resolved).toEqual({
      id: "item-1",
      campaignId: "campaign-1",
      bookId: null,
      bookHref: null,
      title: "Kindle Paperwhite",
      imageUrl: "/images/kindle.jpg",
      description: "Leve e compacto.",
      affiliateUrl: "https://www.amazon.com.br/kindle",
      price: 599.9,
      position: 0,
      isActive: true,
      itemType: "kindle",
    });
  });

  it("resolve um item vinculado a um livro a partir da Biblioteca, nunca dos campos manuais", () => {
    const book = makeBook({ amazon_url: "https://www.amazon.com.br/quando", cover_path: "/covers/quando.jpg" });
    const item = makeItem({
      book_id: book.id,
      item_type: "book",
      price: 10,
      // Mesmo que campos manuais estivessem preenchidos (não deveriam, pela constraint do banco),
      // o resolvedor sempre prioriza os dados do livro para title/imageUrl/affiliateUrl/description.
      title: "Não deveria aparecer",
      image_url: "/nao-deveria-aparecer.jpg",
    });

    const resolved = resolveCampaignItem(item, new Map([[book.id, book]]), "bookcringe-20");

    expect(resolved).toEqual({
      id: "item-1",
      campaignId: "campaign-1",
      bookId: "book-1",
      bookHref: "/livro/quando",
      title: "Quando",
      imageUrl: "/covers/quando.jpg",
      description: null,
      affiliateUrl: "https://www.amazon.com.br/quando?tag=bookcringe-20",
      price: 10,
      position: 0,
      isActive: true,
      itemType: "book",
    });
  });

  it("retorna null para item vinculado a um livro removido da Biblioteca (órfão)", () => {
    const item = makeItem({ book_id: "livro-removido" });

    const resolved = resolveCampaignItem(item, new Map());

    expect(resolved).toBeNull();
  });
});
