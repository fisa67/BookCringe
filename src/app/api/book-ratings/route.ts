import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getBookById } from "@/lib/services/bookService";
import {
  getPublicBookRatingSummary,
  saveBookRating,
} from "@/lib/services/bookRatingService";
import {
  BOOK_RATING_ACCESS_COOKIE,
  verifyBookRatingAccessToken,
} from "@/lib/services/bookRatingAccessToken";
import { bookRatingFormSchema } from "@/lib/validations/ratings";

function getAccessToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${BOOK_RATING_ACCESS_COOKIE}=`));

  return cookie ? decodeURIComponent(cookie.slice(`${BOOK_RATING_ACCESS_COOKIE}=`.length)) : null;
}

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

  const parsed = bookRatingFormSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fields[field]) {
        fields[field] = issue.message;
      }
    }

    return NextResponse.json(
      { error: "Confira os dados da avaliação.", fields },
      { status: 400 }
    );
  }

  const accessToken = getAccessToken(request);
  const subscriberId = accessToken ? verifyBookRatingAccessToken(accessToken) : null;
  if (!subscriberId) {
    return NextResponse.json(
      {
        error:
          "Solicite o link de acesso enviado ao e-mail confirmado do Crew antes de avaliar.",
      },
      { status: 401 }
    );
  }

  const book = await getBookById(parsed.data.bookId);
  if (!book) {
    return NextResponse.json({ error: "Livro não encontrado." }, { status: 404 });
  }

  const result = await saveBookRating({
    bookId: parsed.data.bookId,
    subscriberId,
    rating: parsed.data.rating,
    comment: parsed.data.comment ?? null,
  });

  if (!result.ok) {
    if (result.reason === "not-confirmed") {
      return NextResponse.json(
        {
          error:
            "Apenas membros confirmados do Crew Literário podem avaliar livros.",
          fields: { email: "Este e-mail ainda não está confirmado no Crew." },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Não foi possível salvar sua avaliação. Tente novamente." },
      { status: 500 }
    );
  }

  revalidatePath(`/livro/${book.slug}`);
  const summary = await getPublicBookRatingSummary(book.id);

  return NextResponse.json({
    message: "✅ Avaliação salva com sucesso.",
    summary,
  });
}
