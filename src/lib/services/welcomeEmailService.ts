import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { getFromEmail } from "@/lib/env";
import { escapeHtml, getResendClient } from "@/lib/email/resend";
import { getPublicRecommendationOfMonth } from "@/lib/adapters/recommendationsPublicAdapter";
import type { ConfirmSubscriberResult } from "@/lib/services/subscriberService";

/**
 * Serviço isolado do e-mail de boas-vindas do Crew Literário — desde a
 * Fase 3C (double opt-in), só é disparado depois que um assinante vira
 * confirmado: na página `/crew-literario/confirmar` (via
 * `confirmSubscriberByToken`) ou na confirmação manual do admin em
 * `/admin/subscribers` (via `confirmSubscriberManually`) — nunca mais em
 * `/api/newsletter/route.ts`, que agora só envia o e-mail de confirmação via
 * `confirmationEmailService`. Mesmo padrão de
 * `campaignEmailService.ts` (Resend + `getFromEmail` + `escapeHtml`), mas
 * nunca deve impedir a confirmação: qualquer erro aqui — inclusive
 * `getResendClient`/`getFromEmail` lançando por env mal configurada — é
 * sempre capturado e devolvido como `{ ok: false, error }`, nunca
 * propagado.
 */

export const WELCOME_EMAIL_SUBJECT = "📚 Bem-vindo ao Crew Literário";

/**
 * Decide se o e-mail de boas-vindas deve ser enviado para o resultado de
 * `confirmSubscriberByToken` — só na transição real pendente → confirmado
 * (`alreadyConfirmed: false`), nunca de novo se o link de confirmação já
 * tiver sido usado antes. Extraída como função pura (em vez de inline na
 * página) para ser testável sem precisar montar a página inteira.
 */
export function shouldSendWelcomeEmail(result: ConfirmSubscriberResult): boolean {
  return result.ok && !result.alreadyConfirmed;
}

interface WelcomeEmailLink {
  emoji: string;
  label: string;
  href: string;
}

const BASE_LINKS: WelcomeEmailLink[] = [
  { emoji: "📚", label: "Curadoria BookCringe", href: `${SITE_URL}/recomendacoes` },
  { emoji: "📖", label: "Biblioteca", href: `${SITE_URL}/biblioteca` },
  { emoji: "🎥", label: "Conteúdos", href: `${SITE_URL}/conteudos` },
];

/**
 * Resolve o link de "Recomendação do mês" a partir do livro marcado no CMS
 * (`is_recommendation_of_month`, ver `getPublicRecommendationOfMonth`) —
 * não há URL fixa para essa seção, o slug muda quando o admin troca o
 * destaque. `null` quando não há nenhum livro marcado (seção omitida do
 * e-mail) ou quando a consulta falha — nunca deixa essa etapa quebrar o
 * envio do e-mail de boas-vindas.
 */
async function getRecommendationOfMonthLink(): Promise<WelcomeEmailLink | null> {
  try {
    const recommendation = await getPublicRecommendationOfMonth();

    if (!recommendation) {
      return null;
    }

    return {
      emoji: "⭐",
      label: "Recomendação do mês",
      href: `${SITE_URL}/livro/${recommendation.slug}`,
    };
  } catch (err) {
    console.error("[welcomeEmailService] getRecommendationOfMonthLink error", err);
    return null;
  }
}

function buildWelcomeText(links: WelcomeEmailLink[]): string {
  const linkLines = links.flatMap(({ emoji, label, href }) => [`${emoji} ${label}`, href, ""]);

  return [
    "Olá!",
    "",
    "Que bom ter você por aqui.",
    "",
    "O Crew Literário nasceu para compartilhar",
    "leituras, reflexões e recomendações que realmente valem o seu tempo.",
    "",
    "Se você está chegando agora, recomendo começar por:",
    "",
    ...linkLines,
    "Boas leituras!",
    "",
    "— Filipe Santos",
    SITE_NAME,
  ].join("\n");
}

function buildWelcomeHtml(links: WelcomeEmailLink[]): string {
  const linksHtml = links
    .map(
      ({ emoji, label, href }) => `
        <p style="margin: 0 0 20px;">
          ${emoji} <strong>${escapeHtml(label)}</strong><br />
          <a href="${escapeHtml(href)}" style="color: #1a1a1a;">${escapeHtml(href)}</a>
        </p>`
    )
    .join("\n");

  return `
    <div style="font-family: sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto;">
      <p style="margin: 0 0 16px;">Olá!</p>
      <p style="margin: 0 0 16px;">Que bom ter você por aqui.</p>
      <p style="margin: 0 0 16px;">
        O Crew Literário nasceu para compartilhar leituras, reflexões e recomendações que realmente valem o seu
        tempo.
      </p>
      <p style="margin: 0 0 20px;">Se você está chegando agora, recomendo começar por:</p>
      ${linksHtml}
      <p style="margin: 0 0 16px;">Boas leituras!</p>
      <p style="margin: 0;">
        — Filipe Santos<br />
        ${escapeHtml(SITE_NAME)}
      </p>
    </div>
  `.trim();
}

export interface SendWelcomeEmailResult {
  ok: boolean;
  error?: string;
}

/**
 * Envia o e-mail de boas-vindas para um inscrito recém-cadastrado. Sempre
 * resolve (nunca rejeita) — falhas de envio (Resend indisponível, env
 * ausente etc.) são logadas e devolvidas como `{ ok: false, error }`, para
 * que quem chama (o endpoint de cadastro) nunca precise de try/catch para
 * continuar funcionando sem o e-mail.
 */
export async function sendWelcomeEmail(email: string): Promise<SendWelcomeEmailResult> {
  try {
    const recommendationOfMonthLink = await getRecommendationOfMonthLink();
    const links = recommendationOfMonthLink ? [...BASE_LINKS, recommendationOfMonthLink] : BASE_LINKS;

    const resend = getResendClient();

    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: email,
      subject: WELCOME_EMAIL_SUBJECT,
      html: buildWelcomeHtml(links),
      text: buildWelcomeText(links),
    });

    if (error) {
      console.error("[welcomeEmailService] sendWelcomeEmail error", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    console.error("[welcomeEmailService] sendWelcomeEmail unexpected error", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro desconhecido ao enviar e-mail de boas-vindas.",
    };
  }
}
