import { NextResponse } from "next/server";
import { newsletterSubscribeSchema } from "@/lib/validations/newsletter";
import { createSubscriber } from "@/lib/services/subscriberService";

/**
 * Endpoint público do formulário "Clube dos Leitores BookCringe"
 * (`NewsletterForm`, Home/Recomendações/Livro/Conteúdos). Mesmo padrão de
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

  return NextResponse.json({
    message: "✅ Você entrou para o Clube dos Leitores BookCringe.",
  });
}
