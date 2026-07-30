import { NextResponse } from "next/server";
import { sendFormEmails } from "@/lib/email/send-form-email";
import { STORE_INTEREST_SUCCESS_MESSAGE } from "@/lib/constants";
import { getStoreCollectionById, getStoreProductById } from "@/lib/services/storeService";
import { createStoreInterest } from "@/lib/services/storeInterestService";
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

  let submission = parsed.data;

  if (submission.formType === "store-interesse") {
    const [collection, product] = await Promise.all([
      getStoreCollectionById(submission.collectionId),
      getStoreProductById(submission.collectionId, submission.productId),
    ]);

    if (
      !collection ||
      !product ||
      !collection.is_active ||
      !product.is_active ||
      product.collection_id !== collection.id
    ) {
      return NextResponse.json(
        { error: "Produto ou coleção não encontrados para registrar o interesse." },
        { status: 400 }
      );
    }

    submission = {
      ...submission,
      collectionName: collection.name,
      productName: product.name,
    };

    const interest = await createStoreInterest({
      collection_id: collection.id,
      product_id: product.id,
      name: submission.name,
      email: submission.email,
      message: submission.message ?? null,
    });

    if (!interest) {
      return NextResponse.json(
        { error: "Não foi possível registrar seu interesse. Tente novamente em alguns minutos." },
        { status: 500 }
      );
    }

    try {
      await sendFormEmails(submission);
    } catch (error) {
      console.error("[api/contact] Erro ao enviar e-mail do interesse:", error);
      // O interesse já está persistido e disponível no painel administrativo.
      // Uma falha transiente do provedor de e-mail não deve gerar duplicidade
      // quando o usuário tentar novamente.
    }

    return NextResponse.json({ message: STORE_INTEREST_SUCCESS_MESSAGE });
  }

  try {
    await sendFormEmails(submission);

    return NextResponse.json({
      message: "Mensagem enviada com sucesso! Você receberá um e-mail de confirmação em breve.",
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
