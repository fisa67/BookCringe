import { NextResponse } from "next/server";
import { sendFormEmails } from "@/lib/email/send-form-email";
import {
  formatValidationErrors,
  formSubmissionSchema,
} from "@/lib/validations/forms";

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

  const parsed = formSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados do formulário inválidos.",
        fields: formatValidationErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  try {
    await sendFormEmails(parsed.data);

    return NextResponse.json({
      message:
        "Mensagem enviada com sucesso! Você receberá um e-mail de confirmação em breve.",
    });
  } catch (error) {
    console.error("[api/contact] Erro ao enviar e-mail:", error);

    return NextResponse.json(
      {
        error:
          "Não foi possível enviar sua mensagem no momento. Tente novamente em alguns minutos.",
      },
      { status: 500 }
    );
  }
}
