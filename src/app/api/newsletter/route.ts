import { NextResponse } from "next/server";
import { newsletterSubscribeSchema } from "@/lib/validations/newsletter";
import { createSubscriber } from "@/lib/services/subscriberService";
import { sendConfirmationEmail } from "@/lib/services/confirmationEmailService";

/**
 * Endpoint público do formulário "Crew Literário"
 * (`NewsletterForm`, Home/Recomendações/Livro/Conteúdos/Crew Literário). Mesmo padrão de
 * `/api/contact/route.ts`: client component + `fetch`, sem Server Action
 * (Server Actions neste projeto são usadas só no admin).
 *
 * Fase 3C (double opt-in): este endpoint NUNCA envia o e-mail de
 * boas-vindas — só o e-mail de confirmação. O welcome e-mail só é
 * disparado depois, em `/crew-literario/confirmar`, quando o token é
 * validado com sucesso.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido. Envie JSON válido." },
      { status: 400 }
    );
  }

  const parsed = newsletterSubscribeSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }

    return NextResponse.json(
      { error: "Informe um e-mail válido.", fields: fieldErrors },
      { status: 400 }
    );
  }

  const result = await createSubscriber(parsed.data);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  if (result.subscriberStatus === "confirmed") {
    return NextResponse.json({
      message: "✅ Você já faz parte do Crew Literário — nenhuma ação necessária.",
    });
  }

  // "new" ou "pending": sempre há `confirmationToken` (ver createSubscriber).
  // Nunca bloqueia nem falha o cadastro: `sendConfirmationEmail` sempre
  // resolve, mesmo em erro, e o subscriber já foi salvo (ou já tinha o
  // token renovado) com sucesso acima.
  const confirmationResult = await sendConfirmationEmail(parsed.data.email, result.confirmationToken);

  if (!confirmationResult.ok) {
    console.error("[api/newsletter] falha ao enviar e-mail de confirmação", confirmationResult.error);
  }

  return NextResponse.json({
    message:
      "📬 Quase lá! Enviamos um e-mail de confirmação — clique no link para entrar no Crew Literário.",
  });
}
