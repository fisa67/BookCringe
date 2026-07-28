"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  confirmSubscriberManually,
  deleteSubscriber,
  regenerateConfirmationToken,
} from "@/lib/services/subscriberService";
import { sendConfirmationEmail } from "@/lib/services/confirmationEmailService";
import { sendWelcomeEmail } from "@/lib/services/welcomeEmailService";

/**
 * Server Actions do módulo Assinantes — mesma convenção dos demais módulos
 * do admin (redireciona de volta com `?error=` em caso de falha). Só ações
 * individuais nesta fase — sem exclusão, confirmação ou reenvio em lote.
 */

/**
 * Confirmação manual (sem token) — para leitores antigos/conhecidos. Envia
 * o mesmo e-mail de boas-vindas do fluxo público (`welcomeEmailService`)
 * logo em seguida, para manter a regra "welcome só depois de confirmado"
 * válida também para quem é confirmado pelo admin, não só por quem clica no
 * link do e-mail. Nunca desfaz a confirmação se o welcome falhar ao enviar
 * (mesma resiliência do resto do app — `sendWelcomeEmail` nunca lança).
 */
export async function confirmSubscriberAction(id: string): Promise<void> {
  const result = await confirmSubscriberManually(id);

  if (!result.ok) {
    redirect(`/admin/subscribers?error=${encodeURIComponent(result.error)}`);
  }

  const welcomeResult = await sendWelcomeEmail(result.email);

  if (!welcomeResult.ok) {
    console.error(
      "[admin/subscribers] falha ao enviar boas-vindas após confirmação manual",
      welcomeResult.error
    );
  }

  revalidatePath("/admin/subscribers");
  revalidatePath("/admin");
  // `justConfirmed` (não `confirmed`) para não colidir com o filtro
  // `?confirmed=confirmed|pending` já usado na listagem.
  redirect("/admin/subscribers?justConfirmed=1");
}

export async function deleteSubscriberAction(id: string): Promise<void> {
  const ok = await deleteSubscriber(id);

  if (!ok) {
    redirect(
      `/admin/subscribers?error=${encodeURIComponent("Não foi possível excluir o assinante. Tente novamente.")}`
    );
  }

  revalidatePath("/admin/subscribers");
  revalidatePath("/admin");
  redirect("/admin/subscribers?deleted=1");
}

/**
 * Reenvia o e-mail de confirmação do double opt-in: regenera o token
 * (`regenerateConfirmationToken`, que já recusa assinantes já confirmados)
 * e envia com o mesmo template do fluxo público
 * (`confirmationEmailService.sendConfirmationEmail`) — nada de template
 * separado para o reenvio manual do admin.
 */
export async function resendConfirmationAction(id: string): Promise<void> {
  const tokenResult = await regenerateConfirmationToken(id);

  if (!tokenResult.ok) {
    redirect(`/admin/subscribers?error=${encodeURIComponent(tokenResult.error)}`);
  }

  const emailResult = await sendConfirmationEmail(tokenResult.email, tokenResult.confirmationToken);

  if (!emailResult.ok) {
    redirect(
      `/admin/subscribers?error=${encodeURIComponent("⚠️ Não foi possível reenviar a confirmação.")}`
    );
  }

  revalidatePath("/admin/subscribers");
  redirect("/admin/subscribers?resent=1");
}
