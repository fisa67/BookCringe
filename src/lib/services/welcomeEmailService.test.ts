import { beforeEach, describe, expect, it, vi } from "vitest";
import { getResendClient } from "@/lib/email/resend";
import { getPublicRecommendationOfMonth } from "@/lib/adapters/recommendationsPublicAdapter";
import { sendWelcomeEmail, shouldSendWelcomeEmail, WELCOME_EMAIL_SUBJECT } from "./welcomeEmailService";

/**
 * Testes básicos de robustez do e-mail de boas-vindas — cobrem:
 *   1. `shouldSendWelcomeEmail` só autoriza envio para cadastro genuinamente
 *      novo (regra "não enviar de novo para quem já é do Crew").
 *   2. `sendWelcomeEmail` monta assunto/links corretos, incluindo o link
 *      dinâmico de "Recomendação do mês" quando disponível.
 *   3. `sendWelcomeEmail` NUNCA lança — erro do Resend (retornado), erro ao
 *      resolver a recomendação do mês, ou exceção (env ausente, rede etc.)
 *      sempre viram `{ ok: false, error }` (ou `ok: true` sem o 4º link,
 *      no caso da recomendação), para que `/api/newsletter` nunca falhe o
 *      cadastro por causa disso.
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

vi.mock("@/lib/adapters/recommendationsPublicAdapter", () => ({
  getPublicRecommendationOfMonth: vi.fn(),
}));

describe("shouldSendWelcomeEmail", () => {
  it("retorna true para cadastro novo", () => {
    expect(shouldSendWelcomeEmail({ ok: true, alreadySubscribed: false })).toBe(true);
  });

  it("retorna false para quem já é inscrito (evita reenvio)", () => {
    expect(shouldSendWelcomeEmail({ ok: true, alreadySubscribed: true })).toBe(false);
  });

  it("retorna false quando o cadastro falhou", () => {
    expect(shouldSendWelcomeEmail({ ok: false, error: "erro ao salvar" })).toBe(false);
  });
});

describe("sendWelcomeEmail", () => {
  beforeEach(() => {
    sendMock.mockReset();
    vi.mocked(getResendClient).mockImplementation(() => ({
      emails: { send: sendMock },
    }) as unknown as ReturnType<typeof getResendClient>);
    // Sem recomendação do mês marcada por padrão — cada teste que precisar
    // dela sobrescreve explicitamente.
    vi.mocked(getPublicRecommendationOfMonth).mockResolvedValue(null);
  });

  it("envia com assunto correto, destinatário certo e os 3 links fixos", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });

    const result = await sendWelcomeEmail("leitor@example.com");

    expect(result).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalledTimes(1);

    const payload = sendMock.mock.calls[0][0];
    expect(payload.to).toBe("leitor@example.com");
    expect(payload.subject).toBe(WELCOME_EMAIL_SUBJECT);
    expect(payload.subject).toContain("Bem-vindo ao Crew Literário");

    for (const path of ["/recomendacoes", "/biblioteca", "/conteudos"]) {
      expect(payload.text).toContain(path);
      expect(payload.html).toContain(path);
    }
    expect(payload.text).not.toContain("Recomendação do mês");
  });

  it("inclui o link de \"Recomendação do mês\" quando há um livro marcado no CMS", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });
    vi.mocked(getPublicRecommendationOfMonth).mockResolvedValue({
      slug: "livro-do-mes",
    } as Awaited<ReturnType<typeof getPublicRecommendationOfMonth>>);

    const result = await sendWelcomeEmail("leitor@example.com");

    expect(result).toEqual({ ok: true });
    const payload = sendMock.mock.calls[0][0];
    expect(payload.text).toContain("Recomendação do mês");
    expect(payload.text).toContain("/livro/livro-do-mes");
    expect(payload.html).toContain("/livro/livro-do-mes");
  });

  it("omite o link de \"Recomendação do mês\" sem falhar o envio quando a busca dá erro", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });
    vi.mocked(getPublicRecommendationOfMonth).mockRejectedValue(new Error("timeout no Supabase"));

    const result = await sendWelcomeEmail("leitor@example.com");

    expect(result).toEqual({ ok: true });
    const payload = sendMock.mock.calls[0][0];
    expect(payload.text).not.toContain("Recomendação do mês");
    for (const path of ["/recomendacoes", "/biblioteca", "/conteudos"]) {
      expect(payload.text).toContain(path);
    }
  });

  it("devolve { ok: false, error } quando o Resend responde com erro, sem lançar", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "Resend indisponível" } });

    const result = await sendWelcomeEmail("leitor@example.com");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Resend indisponível");
  });

  it("devolve { ok: false, error } sem lançar quando getResendClient lança (ex.: env ausente)", async () => {
    vi.mocked(getResendClient).mockImplementationOnce(() => {
      throw new Error("RESEND_API_KEY ausente");
    });

    const result = await sendWelcomeEmail("leitor@example.com");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("RESEND_API_KEY ausente");
  });

  it("nunca lança, mesmo com uma falha inesperada (ex.: timeout de rede)", async () => {
    sendMock.mockRejectedValue(new Error("timeout"));

    await expect(sendWelcomeEmail("leitor@example.com")).resolves.toMatchObject({ ok: false });
  });
});
