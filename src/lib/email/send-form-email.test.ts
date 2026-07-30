import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendFormEmails } from "./send-form-email";

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
  getServerEnv: vi.fn(() => ({ CONTACT_EMAIL: "contato@bookcringe.com.br" })),
}));

describe("BookCringe Store interest email", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: "email_123" }, error: null });
  });

  it("envia o produto de interesse no e-mail interno e na confirmação", async () => {
    await sendFormEmails({
      formType: "store-interesse",
      name: "Leitora",
      email: "leitora@example.com",
      collectionId: "11111111-1111-4111-8111-111111111111",
      collectionName: "Crew Collection #001",
      productId: "22222222-2222-4222-8222-222222222222",
      productName: 'Camiseta "Cringe por fora. Cult por dentro."',
      message: "Tenho interesse na primeira tiragem.",
    });

    expect(sendMock).toHaveBeenCalledTimes(2);
    const internalEmail = sendMock.mock.calls[0][0];
    const confirmationEmail = sendMock.mock.calls[1][0];

    expect(internalEmail.subject).toContain('Camiseta "Cringe por fora. Cult por dentro."');
    expect(internalEmail.text).toContain("Coleção: Crew Collection #001");
    expect(internalEmail.text).toContain(
      'Produto: Camiseta "Cringe por fora. Cult por dentro."'
    );
    expect(confirmationEmail.text).toContain("Crew Collection #001");
  });
});
