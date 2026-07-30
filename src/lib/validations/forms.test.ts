import { describe, expect, it } from "vitest";
import { storeInterestFormSchema } from "./forms";

const storeInterest = {
  formType: "store-interesse" as const,
  name: "Leitora",
  email: "leitora@example.com",
  collectionId: "11111111-1111-4111-8111-111111111111",
  collectionName: "Crew Collection #001",
  productId: "22222222-2222-4222-8222-222222222222",
  productName: 'Camiseta "Cringe por fora. Cult por dentro."',
};

describe("storeInterestFormSchema", () => {
  it("aceita interesse sem mensagem", () => {
    const result = storeInterestFormSchema.safeParse({
      ...storeInterest,
      message: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBeUndefined();
    }
  });

  it("exige o contexto da coleção e do produto", () => {
    const result = storeInterestFormSchema.safeParse({
      ...storeInterest,
      collectionId: undefined,
    });

    expect(result.success).toBe(false);
  });
});
