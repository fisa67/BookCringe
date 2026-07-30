import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  sendFormEmails: vi.fn(),
  getStoreCollectionById: vi.fn(),
  getStoreProductById: vi.fn(),
  createStoreInterest: vi.fn(),
}));

vi.mock("@/lib/email/send-form-email", () => ({
  sendFormEmails: mocks.sendFormEmails,
}));

vi.mock("@/lib/services/storeService", () => ({
  getStoreCollectionById: mocks.getStoreCollectionById,
  getStoreProductById: mocks.getStoreProductById,
}));

vi.mock("@/lib/services/storeInterestService", () => ({
  createStoreInterest: mocks.createStoreInterest,
}));

function storeInterestRequest() {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      formType: "store-interesse",
      collectionId: "11111111-1111-4111-8111-111111111111",
      collectionName: "nome adulterado",
      productId: "22222222-2222-4222-8222-222222222222",
      productName: "produto adulterado",
      name: "Fulano",
      email: "fulano@example.com",
      message: "",
    }),
  });
}

describe("POST /api/contact — Store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendFormEmails.mockResolvedValue(undefined);
    mocks.createStoreInterest.mockResolvedValue({
      id: "interest-1",
    });
    mocks.getStoreCollectionById.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Crew Collection #001",
      is_active: true,
    });
    mocks.getStoreProductById.mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      collection_id: "11111111-1111-4111-8111-111111111111",
      name: 'Camiseta "Cringe por fora. Cult por dentro."',
      is_active: true,
    });
  });

  it("persiste o interesse e mantém o envio de e-mail", async () => {
    const response = await POST(storeInterestRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "✅ Interesse registrado.\n\nAvisaremos quando esta coleção estiver disponível.",
    });
    expect(mocks.createStoreInterest).toHaveBeenCalledWith({
      collection_id: "11111111-1111-4111-8111-111111111111",
      product_id: "22222222-2222-4222-8222-222222222222",
      name: "Fulano",
      email: "fulano@example.com",
      message: null,
    });
    expect(mocks.sendFormEmails).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionName: "Crew Collection #001",
        productName: 'Camiseta "Cringe por fora. Cult por dentro."',
      })
    );
  });

  it("mantém a confirmação quando o interesse foi salvo, mas o e-mail falhou", async () => {
    mocks.sendFormEmails.mockRejectedValueOnce(new Error("Resend indisponível"));

    const response = await POST(storeInterestRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty("message", "✅ Interesse registrado.\n\nAvisaremos quando esta coleção estiver disponível.");
    expect(mocks.createStoreInterest).toHaveBeenCalledTimes(1);
  });
});
