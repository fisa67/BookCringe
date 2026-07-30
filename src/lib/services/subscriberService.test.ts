import { beforeEach, describe, expect, it, vi } from "vitest";
import { confirmSubscriberByToken, generateConfirmationToken } from "./subscriberService";

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabaseAdminClient: {
    from: fromMock,
  },
}));

/**
 * Cobre a geração pura de tokens e a confirmação idempotente com um mock
 * mínimo do `supabaseAdminClient`. As demais funções de consulta e CRUD
 * continuam dependentes de uma suíte de integração.
 *
 * Reforça os requisitos de segurança pedidos na Fase 3C: token único e
 * difícil de adivinhar.
 */
describe("generateConfirmationToken", () => {
  it("gera uma string hexadecimal de 64 caracteres (32 bytes, 256 bits de entropia)", () => {
    const token = generateConfirmationToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("nunca repete valores entre chamadas (checado em uma amostra grande)", () => {
    const tokens = new Set(Array.from({ length: 1000 }, () => generateConfirmationToken()));
    expect(tokens.size).toBe(1000);
  });
});

describe("confirmSubscriberByToken", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("confirma o token uma vez e preserva o token para acessos repetidos", async () => {
    const initialLookup = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "subscriber-1", email: "leitor@example.com", confirmed_at: null },
            error: null,
          }),
        })),
      })),
    };
    const updateMock = vi.fn(() => ({
      eq: vi.fn(() => ({
        is: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "subscriber-1",
                email: "leitor@example.com",
                confirmed_at: "2026-07-30T12:00:00.000Z",
              },
              error: null,
            }),
          })),
        })),
      })),
    }));

    fromMock.mockReturnValueOnce(initialLookup).mockReturnValueOnce({ update: updateMock });

    await expect(confirmSubscriberByToken("token-xyz")).resolves.toEqual({
      ok: true,
      email: "leitor@example.com",
      alreadyConfirmed: false,
    });
    expect(updateMock).toHaveBeenCalledWith({ confirmed_at: expect.any(String) });
  });

  it("retorna já confirmado quando o mesmo token é acessado novamente", async () => {
    fromMock.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              id: "subscriber-1",
              email: "leitor@example.com",
              confirmed_at: "2026-07-30T12:00:00.000Z",
            },
            error: null,
          }),
        })),
      })),
    });

    await expect(confirmSubscriberByToken("token-xyz")).resolves.toEqual({
      ok: true,
      email: "leitor@example.com",
      alreadyConfirmed: true,
    });
  });

  it("trata uma corrida entre duas confirmações como já confirmado", async () => {
    const pendingLookup = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "subscriber-1", email: "leitor@example.com", confirmed_at: null },
            error: null,
          }),
        })),
      })),
    };
    const conditionalUpdate = {
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
        })),
      })),
    };
    const reread = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { email: "leitor@example.com", confirmed_at: "2026-07-30T12:00:00.000Z" },
            error: null,
          }),
        })),
      })),
    };

    fromMock.mockReturnValueOnce(pendingLookup).mockReturnValueOnce(conditionalUpdate).mockReturnValueOnce(reread);

    await expect(confirmSubscriberByToken("token-xyz")).resolves.toEqual({
      ok: true,
      email: "leitor@example.com",
      alreadyConfirmed: true,
    });
  });

  it("mantém erro para token que não existe", async () => {
    fromMock.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    });

    await expect(confirmSubscriberByToken("invalid-token")).resolves.toEqual({
      ok: false,
      error: "Link de confirmação inválido ou já utilizado.",
    });
  });
});
