import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { getFromEmail } from "@/lib/env";
import { escapeHtml, getResendClient } from "@/lib/email/resend";

/**
 * Serviço isolado do e-mail de confirmação do double opt-in (Fase 3C) —
 * único lugar que dispara esse e-mail (chamado por `/api/newsletter/route.ts`
 * depois de `createSubscriber`, para status `"new"` e `"pending"`). Mesmo
 * padrão de `welcomeEmailService.ts`/`campaignEmailService.ts` (Resend +
 * `getFromEmail` + `escapeHtml`), e nunca deve impedir o cadastro: qualquer
 * erro aqui — inclusive `getResendClient`/`getFromEmail` lançando por env
 * mal configurada — é sempre capturado e devolvido como
 * `{ ok: false, error }`, nunca propagado.
 */

export const CONFIRMATION_EMAIL_SUBJECT = "📚 Confirme sua entrada no Crew Literário";

/** URL que o inscrito clica para confirmar — validada por `confirmSubscriberByToken` em `/crew-literario/confirmar`. */
export function buildConfirmationUrl(token: string): string {
  return `${SITE_URL}/crew-literario/confirmar?token=${encodeURIComponent(token)}`;
}

function buildConfirmationText(token: string): string {
  const url = buildConfirmationUrl(token);

  return [
    "Olá!",
    "",
    "Confirme seu e-mail para receber recomendações,",
    "leituras do mês e novidades do BookCringe.",
    "",
    "Confirmar participação:",
    url,
    "",
    "Se você não se cadastrou no Crew Literário, pode ignorar este e-mail.",
    "",
    SITE_NAME,
  ].join("\n");
}

function buildConfirmationHtml(token: string): string {
  const url = buildConfirmationUrl(token);

  return `
    <div style="font-family: sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto;">
      <p style="margin: 0 0 16px;">Olá!</p>
      <p style="margin: 0 0 24px;">
        Confirme seu e-mail para receber recomendações, leituras do mês e novidades do ${escapeHtml(SITE_NAME)}.
      </p>
      <p style="text-align: center; margin: 0 0 24px;">
        <a
          href="${escapeHtml(url)}"
          style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600;"
        >
          Confirmar participação
        </a>
      </p>
      <p style="margin: 0 0 8px; font-size: 12px; color: #888;">
        Se o botão não funcionar, copie e cole este link no navegador:
      </p>
      <p style="margin: 0 0 24px; font-size: 12px; word-break: break-all;">
        <a href="${escapeHtml(url)}" style="color: #1a1a1a;">${escapeHtml(url)}</a>
      </p>
      <p style="margin: 0; font-size: 12px; color: #888;">
        Se você não se cadastrou no Crew Literário, pode ignorar este e-mail.
      </p>
    </div>
  `.trim();
}

export interface SendConfirmationEmailResult {
  ok: boolean;
  error?: string;
}

/**
 * Envia (ou reenvia) o e-mail de confirmação para um `email`/`token`
 * gerados por `createSubscriber`. Sempre resolve (nunca rejeita) — falhas
 * de envio (Resend indisponível, env ausente etc.) são logadas e
 * devolvidas como `{ ok: false, error }`, para que quem chama (o endpoint
 * de cadastro) nunca precise de try/catch para continuar funcionando: o
 * inscrito já foi salvo no banco antes desta chamada.
 */
export async function sendConfirmationEmail(
  email: string,
  token: string
): Promise<SendConfirmationEmailResult> {
  try {
    const resend = getResendClient();

    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: CONFIRMATION_EMAIL_SUBJECT,
      html: buildConfirmationHtml(token),
      text: buildConfirmationText(token),
    });

    if (error) {
      console.error("[confirmationEmailService] sendConfirmationEmail error", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    console.error("[confirmationEmailService] sendConfirmationEmail unexpected error", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro desconhecido ao enviar e-mail de confirmação.",
    };
  }
}
