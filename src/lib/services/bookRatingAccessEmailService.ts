import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { getFromEmail } from "@/lib/env";
import { escapeHtml, getResendClient } from "@/lib/email/resend";

export async function sendBookRatingAccessEmail(input: {
  email: string;
  bookTitle: string;
  accessToken: string;
  bookId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const accessUrl = `${SITE_URL}/api/book-ratings/verify?bookId=${encodeURIComponent(
    input.bookId
  )}&token=${encodeURIComponent(input.accessToken)}`;

  const html = `
    <p>Olá,</p>
    <p>Recebemos um pedido para avaliar <strong>${escapeHtml(input.bookTitle)}</strong> no ${escapeHtml(SITE_NAME)}.</p>
    <p>
      <a href="${escapeHtml(accessUrl)}">Clique aqui para liberar sua avaliação</a>.
      O link é válido por 15 minutos.
    </p>
    <p>Se você não solicitou este acesso, ignore esta mensagem.</p>
  `.trim();

  const text = [
    "Olá,",
    "",
    `Recebemos um pedido para avaliar "${input.bookTitle}" no ${SITE_NAME}.`,
    "",
    `Acesse o link para liberar sua avaliação: ${accessUrl}`,
    "O link é válido por 15 minutos.",
    "",
    "Se você não solicitou este acesso, ignore esta mensagem.",
  ].join("\n");

  try {
    const { error } = await getResendClient().emails.send({
      from: getFromEmail(),
      to: input.email,
      subject: `Acessar avaliação — ${input.bookTitle}`,
      html,
      text,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao enviar o e-mail.",
    };
  }
}
