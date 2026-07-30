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

  it("aceita item com preço opcional e URL afiliada http(s)", () => {
    const result = promotionalCampaignItemFormSchema.safeParse({
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
  });

  it("rejeita protocolos inseguros em imagem e link", () => {
    const result = promotionalCampaignItemFormSchema.safeParse({
      title: "Oferta",
      image_url: "javascript:alert(1)",
      affiliate_url: "javascript:alert(1)",
      is_active: true,
      item_type: "other",
    });

    expect(result.success).toBe(false);
  });
});
