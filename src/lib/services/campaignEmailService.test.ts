import { beforeEach, describe, expect, it, vi } from "vitest";
import { getResendClient } from "@/lib/email/resend";
import { getConfirmedSubscriberEmails } from "@/lib/services/subscriberService";
import {
  buildCampaignHtml,
  buildCampaignText,
  sendCampaignTest,
  sendCampaignToCrew,
} from "./campaignEmailService";

const sendMock = vi.fn();
const batchSendMock = vi.fn();

vi.mock("@/lib/email/resend", () => ({
  getResendClient: vi.fn(() => ({
    emails: { send: sendMock },
    batch: { send: batchSendMock },
  })),
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
  getServerEnv: vi.fn(() => ({ CONTACT_EMAIL: "contato@bookcringe.com.br" })),
}));

vi.mock("@/lib/services/subscriberService", () => ({
  getConfirmedSubscriberEmails: vi.fn(),
}));

describe("campaign email renderer", () => {
  it("mantém CTA e Rich Text no preview final, sem expor sintaxe interna", () => {
    const html = buildCampaignHtml(`
      <h2>Recomendação do mês</h2>
      <p>Leia a <strong>curadoria</strong> desta edição.</p>
      <a href="https://bookcringe.com.br/recomendacoes" data-newsletter-cta="true">Conheça a Curadoria</a>
    `);

    expect(html).toContain("<h2");
    expect(html).toContain("<strong>curadoria</strong>");
    expect(html).toContain("Conheça a Curadoria");
    expect(html).toContain('role="presentation"');
    expect(html).not.toContain("data-newsletter-cta");
  });

  it("gera texto alternativo sem tags HTML", () => {
    const text = buildCampaignText("<p>Leia <strong>mais</strong>.</p>");

    expect(text).toContain("Leia mais.");
    expect(text).not.toContain("<p>");
    expect(text).not.toContain("<strong>");
  });
});

describe("campaign sending", () => {
  beforeEach(() => {
    sendMock.mockReset();
    batchSendMock.mockReset();
    vi.mocked(getResendClient).mockImplementation(
      () =>
        ({
          emails: { send: sendMock },
          batch: { send: batchSendMock },
        }) as unknown as ReturnType<typeof getResendClient>
    );
  });

  it("usa o mesmo HTML Rich Text/CTA no envio de teste", async () => {
    sendMock.mockResolvedValue({ data: { id: "test_123" }, error: null });
    const campaign = {
      subject: "Curadoria",
      content: '<p>Olá</p><a href="https://example.com" data-newsletter-cta="true">Leia mais</a>',
    };

    await expect(sendCampaignTest(campaign)).resolves.toEqual({ ok: true });

    const payload = sendMock.mock.calls[0][0];
    expect(payload.html).toContain("Leia mais");
    expect(payload.html).toContain('role="presentation"');
    expect(payload.text).toContain("Leia mais");
  });

  it("usa o mesmo HTML Rich Text/CTA no envio para o Crew", async () => {
    vi.mocked(getConfirmedSubscriberEmails).mockResolvedValue(["leitor@example.com"]);
    batchSendMock.mockResolvedValue({ data: { id: "batch_123" }, error: null });

    await expect(
      sendCampaignToCrew({
        subject: "Curadoria",
        content: '<p>Olá</p><a href="https://example.com" data-newsletter-cta="true">Assistir vídeo</a>',
      })
    ).resolves.toMatchObject({ ok: true, recipientsCount: 1 });

    const payload = batchSendMock.mock.calls[0][0][0];
    expect(payload.html).toContain("Assistir vídeo");
    expect(payload.html).toContain('role="presentation"');
    expect(payload.text).toContain("Assistir vídeo");
  });
});
