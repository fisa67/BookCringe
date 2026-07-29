import { SITE_NAME } from "@/lib/constants";
import { getFromEmail, getServerEnv } from "@/lib/env";
import { escapeHtml, getResendClient } from "@/lib/email/resend";
import {
  newsletterContentToPlainText,
  renderNewsletterContentForEmail,
} from "@/lib/newsletters/content";
import { getConfirmedSubscriberEmails } from "@/lib/services/subscriberService";
import type { CmsNewsletterCampaignRecord } from "@/lib/types/cms";

/**
 * Serviço isolado de envio de campanhas do Crew Literário (Fase 3B) — único
 * lugar que fala com o Resend para newsletters (separado de
 * `send-form-email.ts`, que é dos formulários de contato). Nenhuma outra
 * parte do app deveria importar `getResendClient` para isto.
 *
 * Sem automações, sequência de boas-vindas, agendamento real ou
 * segmentação avançada nesta fase — só teste (`sendCampaignTest`) e envio
 * único em massa (`sendCampaignToCrew`), sempre disparado manualmente por
 * uma Server Action do admin. O conteúdo Rich Text e os CTAs passam pelo
 * mesmo renderer de HTML compatível com e-mail no preview e no envio.
 */

/** Limite de itens por chamada de `resend.batch.send` — envio em massa é fatiado em lotes desse tamanho. */
const BATCH_CHUNK_SIZE = 100;

/** Exportado para o preview renderizar exatamente o mesmo HTML que será enviado. */
export function buildCampaignHtml(content: string): string {
  const renderedContent = renderNewsletterContentForEmail(content);

  return `
    <div style="font-family: sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto;">
      ${renderedContent}
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5;" />
      <p style="font-size: 12px; color: #888;">
        Você está recebendo este e-mail porque faz parte do Crew Literário do ${escapeHtml(SITE_NAME)}.
      </p>
    </div>
  `.trim();
}

export function buildCampaignText(content: string): string {
  return `${newsletterContentToPlainText(content)}\n\n---\nVocê está recebendo este e-mail porque faz parte do Crew Literário do ${SITE_NAME}.`;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

type CampaignEmailInput = Pick<CmsNewsletterCampaignRecord, "subject" | "content">;

export interface SendCampaignResult {
  ok: boolean;
  error?: string;
}

/**
 * Envia a campanha só para `CONTACT_EMAIL` — passo de segurança obrigatório
 * do fluxo do admin antes do envio em massa ([Enviar teste] → recebo no meu
 * e-mail → [Enviar para o Crew]). Assunto prefixado com "[TESTE]" para
 * nunca ser confundido com o envio de verdade.
 */
export async function sendCampaignTest(campaign: CampaignEmailInput): Promise<SendCampaignResult> {
  const { CONTACT_EMAIL } = getServerEnv();
  const resend = getResendClient();

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to: CONTACT_EMAIL,
    subject: `[TESTE] ${campaign.subject}`,
    html: buildCampaignHtml(campaign.content),
    text: buildCampaignText(campaign.content),
  });

  if (error) {
    console.error("[campaignEmailService] sendCampaignTest error", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export interface SendToCrewResult {
  ok: boolean;
  recipientsCount: number;
  error?: string;
}

/**
 * Envia a campanha para todos os inscritos confirmados
 * (`newsletter_subscribers.confirmed_at is not null` — ver
 * `subscriberService.getConfirmedSubscriberEmails`). Nunca envia nada e
 * nunca marca a campanha como enviada quando a lista está vazia (hoje é
 * sempre o caso, sem double opt-in) — quem marca `sent` é a Server Action
 * chamadora (`sendToCrewAction`), só depois de `ok: true` aqui.
 *
 * Cada destinatário recebe um e-mail individual via `resend.batch.send`
 * (nunca múltiplos e-mails no mesmo `to` — isso exporia a lista de
 * inscritos entre si), fatiado em lotes de `BATCH_CHUNK_SIZE`. Limitação
 * conhecida e aceita nesta fase: se um lote falhar no meio do envio, os
 * lotes anteriores já foram entregues, mas a campanha não é marcada como
 * enviada — não há retomada/idempotência automática (fora de escopo até
 * existir fila/automação real).
 */
export async function sendCampaignToCrew(campaign: CampaignEmailInput): Promise<SendToCrewResult> {
  const emails = await getConfirmedSubscriberEmails();

  if (emails === null) {
    return {
      ok: false,
      recipientsCount: 0,
      error: "Não foi possível carregar a lista de inscritos confirmados.",
    };
  }

  if (emails.length === 0) {
    return {
      ok: false,
      recipientsCount: 0,
      error:
        "Nenhum inscrito confirmado ainda (confirmed_at) — nenhum e-mail foi enviado. Isso é esperado até uma integração de confirmação existir.",
    };
  }

  const resend = getResendClient();
  const from = getFromEmail();
  const html = buildCampaignHtml(campaign.content);
  const batches = chunk(emails, BATCH_CHUNK_SIZE);

  for (let i = 0; i < batches.length; i++) {
    const { error } = await resend.batch.send(
      batches[i].map((email) => ({
        from,
        to: email,
        subject: campaign.subject,
        html,
        text: buildCampaignText(campaign.content),
      }))
    );

    if (error) {
      console.error("[campaignEmailService] sendCampaignToCrew error", { batch: i, error });
      return {
        ok: false,
        recipientsCount: 0,
        error: `Falha ao enviar (lote ${i + 1} de ${batches.length}): ${error.message}`,
      };
    }
  }

  return { ok: true, recipientsCount: emails.length };
}
