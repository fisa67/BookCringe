import { describe, expect, it } from "vitest";
import {
  promotionalCampaignFormSchema,
  promotionalCampaignItemFormSchema,
} from "./promotionalCampaign";

describe("promotional campaign validation", () => {
  it("aceita uma campanha inativa sem banner", () => {
    const result = promotionalCampaignFormSchema.safeParse({
      name: "Kindle Day",
      slug: "kindle-day",
      description: "",
      banner_url: "",
      is_active: false,
    });

    expect(result.success).toBe(true);
  });

  it("rejeita slug fora do formato público", () => {
    const result = promotionalCampaignFormSchema.safeParse({
      name: "Black Friday",
      slug: "Black Friday 2026",
      is_active: false,
    });

    expect(result.success).toBe(false);
  });

  it("aceita item manual com preço opcional e URL afiliada http(s)", () => {
    const result = promotionalCampaignItemFormSchema.safeParse({
      source_type: "manual",
      book_id: null,
      title: "Kindle Paperwhite",
      image_url: "/images/kindle.jpg",
      description: "Leitura confortável em qualquer lugar.",
      affiliate_url: "https://www.amazon.com.br/kindle",
      price: undefined,
      position: undefined,
      is_active: true,
      item_type: "kindle",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.book_id).toBeNull();
    }
  });

  it("rejeita protocolos inseguros em imagem e link de item manual", () => {
    const result = promotionalCampaignItemFormSchema.safeParse({
      source_type: "manual",
      book_id: null,
      title: "Oferta",
      image_url: "javascript:alert(1)",
      affiliate_url: "javascript:alert(1)",
      is_active: true,
      item_type: "other",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita item manual sem título/imagem/link", () => {
    const result = promotionalCampaignItemFormSchema.safeParse({
      source_type: "manual",
      book_id: null,
      title: null,
      image_url: null,
      affiliate_url: null,
      is_active: true,
      item_type: "other",
    });

    expect(result.success).toBe(false);
  });

  it("aceita item vinculado a um livro sem exigir título/imagem/link manuais, e força item_type='book'", () => {
    const result = promotionalCampaignItemFormSchema.safeParse({
      source_type: "book",
      book_id: "9c6f1e0a-1111-4d3d-9c3a-000000000000",
      title: null,
      image_url: null,
      affiliate_url: null,
      is_active: true,
      // item_type não é enviado pelo form nesse fluxo — testa que o transform ignora/sobrescreve.
      item_type: "other",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.item_type).toBe("book");
      expect(result.data.title).toBeNull();
      expect(result.data.image_url).toBeNull();
      expect(result.data.affiliate_url).toBeNull();
    }
  });

  it("rejeita item vinculado a um livro sem book_id selecionado (null, ausente do FormData)", () => {
    const result = promotionalCampaignItemFormSchema.safeParse({
      source_type: "book",
      book_id: null,
      title: null,
      image_url: null,
      affiliate_url: null,
      is_active: true,
      item_type: "other",
    });

    expect(result.success).toBe(false);
  });
});
