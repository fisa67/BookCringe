import { beforeEach, describe, expect, it, vi } from "vitest";
import { getResendClient } from "@/lib/email/resend";
import {
  buildConfirmationUrl,
  CONFIRMATION_EMAIL_SUBJECT,
  sendConfirmationEmail,
} from "./confirmationEmailService";

/**
 * Testes básicos de robustez do e-mail de confirmação (double opt-in,
 * Fase 3C) — cobrem:
 *   1. `sendConfirmationEmail` monta assunto/destinatário/link de
 *      confirmação corretos, com o token embutido na URL.
 *   2. `sendConfirmationEmail` NUNCA lança — erro do Resend (retornado) ou
 *      exceção (env ausente, rede etc.) sempre viram `{ ok: false, error }`,
 *      para que `/api/newsletter` nunca falhe o cadastro por causa disso
 *      (o inscrito já foi salvo no banco antes desta chamada).
 */

const sendMock = vi.fn();

vi.mock("@/lib/email/resend", () => ({
  getResendClient: vi.fn(() => ({ emails: { send: sendMock } })),
  escapeHtml: (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;"),
}));

vi.mock("@/lib/env", () => ({
  getFromEmail: vi.fn(() => "BookCringe <contato@bookcringe.com.br>"),
}));

describe("buildConfirmationUrl", () => {
  it("inclui o token codificado na query string", () => {
    const url = buildConfirmationUrl("abc123");
    expect(url).toContain("/crew-literario/confirmar?token=abc123");
  });
});

describe("sendConfirmationEmail", () => {
  beforeEach(() => {
    sendMock.mockReset();
    vi.mocked(getResendClient).mockImplementation(() => ({
      emails: { send: sendMock },
    }) as unknown as ReturnType<typeof getResendClient>);
  });

  it("envia com assunto correto, destinatário certo e o link de confirmação com o token", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });

    const result = await sendConfirmationEmail("leitor@example.com", "token-xyz");

    expect(result).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalledTimes(1);

    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe("leitor@example.com");
    expect(payload.subject).toBe(CONFIRMATION_EMAIL_SUBJECT);
    expect(payload.subject).toContain("Confirme sua entrada no Crew Literário");
    expect(payload.text).toContain("/crew-literario/confirmar?token=token-xyz");
    expect(payload.html).toContain("/crew-literario/confirmar?token=token-xyz");
    expect(payload.html).toContain("Confirmar participação");
  });

  it("devolve { ok: false, error } quando o Resend responde com erro, sem lançar", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "Resend indisponível" } });

    const result = await sendConfirmationEmail("leitor@example.com", "token-xyz");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Resend indisponível");
  });

  it("devolve { ok: false, error } sem lançar quando getResendClient lança (ex.: env ausente)", async () => {
    vi.mocked(getResendClient).mockImplementationOnce(() => {
      throw new Error("RESEND_API_KEY ausente");
    });

    const result = await sendConfirmationEmail("leitor@example.com", "token-xyz");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("RESEND_API_KEY ausente");
  });

  it("nunca lança, mesmo com uma falha inesperada (ex.: timeout de rede)", async () => {
    sendMock.mockRejectedValue(new Error("timeout"));

    await expect(sendConfirmationEmail("leitor@example.com", "token-xyz")).resolves.toMatchObject({
      ok: false,
    });
  });
});
