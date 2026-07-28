import { describe, expect, it } from "vitest";
import { generateConfirmationToken } from "./subscriberService";

/**
 * Cobre só a parte de `subscriberService` que é pura e não toca o
 * Supabase (`generateConfirmationToken`) — as demais funções (`createSubscriber`,
 * `confirmSubscriberByToken`, `getSubscribers`...) dependem de
 * `supabaseAdminClient` e ficam para uma futura suíte de integração.
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
