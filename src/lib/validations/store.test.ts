import { describe, expect, it } from "vitest";
import { storeCollectionFormSchema, storeProductFormSchema } from "./store";

describe("BookCringe Store validation", () => {
  it("aceita uma coleção ativa", () => {
    const result = storeCollectionFormSchema.safeParse({
      name: "Crew Collection #001",
      description: "Primeira tiragem. Edição limitada.",
      is_active: true,
    });

    expect(result.success).toBe(true);
  });

  it("aceita produto com quantidade e selo do Crew", () => {
    const result = storeProductFormSchema.safeParse({
      name: "Camiseta BookCringe",
      description: "Cringe por fora. Cult por dentro.",
      image_url: "/images/store/camiseta.jpg",
      price: "79.90",
      quantity: "50",
      position: "",
      is_active: true,
      crew_exclusive: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejeita quantidade negativa e imagem insegura", () => {
    const result = storeProductFormSchema.safeParse({
      name: "Produto inválido",
      image_url: "javascript:alert(1)",
      price: "10",
      quantity: "-1",
      is_active: true,
      crew_exclusive: false,
    });

    expect(result.success).toBe(false);
  });
});
