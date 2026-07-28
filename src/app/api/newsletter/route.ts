import { NextResponse } from "next/server";
import { newsletterSubscribeSchema } from "@/lib/validations/newsletter";
import { createSubscriber } from "@/lib/services/subscriberService";
import { sendWelcomeEmail, shouldSendWelcomeEmail } from "@/lib/services/welcomeEmailService";

/**
 * Endpoint público do formulário "Crew Literário"
 * (`NewsletterForm`, Home/Recomendações/Livro/Conteúdos/Crew Literário). Mesmo padrão de
 * `/api/contact/route.ts`: client component + `fetch`, sem Server Action
 * (Server Actions neste projeto são usadas só no admin).
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

  // E-mail de boas-vindas só para cadastro genuinamente novo — nunca de
  // novo para quem já é do Crew (`shouldSendWelcomeEmail`). Nunca bloqueia
  // nem falha o cadastro: `sendWelcomeEmail` sempre resolve, mesmo em
  // erro, e o subscriber já foi salvo com sucesso acima.
  if (shouldSendWelcomeEmail(result)) {
    const welcomeResult = await sendWelcomeEmail(parsed.data.email);

    if (!welcomeResult.ok) {
      console.error("[api/newsletter] falha ao enviar e-mail de boas-vindas", welcomeResult.error);
    }
  }

  return NextResponse.json({
    message: "✅ Você entrou para o Crew Literário do BookCringe.",
  });
}
