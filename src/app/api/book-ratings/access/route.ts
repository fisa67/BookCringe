import { NextResponse } from "next/server";
import { getBookById } from "@/lib/services/bookService";
import { sendBookRatingAccessEmail } from "@/lib/services/bookRatingAccessEmailService";
import {
  createBookRatingAccessToken,
} from "@/lib/services/bookRatingAccessToken";
import { getConfirmedSubscriberIdByEmail } from "@/lib/services/bookRatingService";
import { bookRatingAccessRequestSchema } from "@/lib/validations/ratings";

const ACCESS_MESSAGE =
  "📬 Se este e-mail pertence a um membro confirmado, enviaremos um link para liberar sua avaliação.";

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

  const parsed = bookRatingAccessRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fields[field]) {
        fields[field] = issue.message;
      }
    }
    return NextResponse.json(
      { error: "Confira o e-mail informado.", fields },
      { status: 400 }
    );
  }

  const book = await getBookById(parsed.data.bookId);
  if (!book) {
    return NextResponse.json({ error: "Livro não encontrado." }, { status: 404 });
  }

  const subscriberId = await getConfirmedSubscriberIdByEmail(parsed.data.email);
  if (!subscriberId) {
    return NextResponse.json({ message: ACCESS_MESSAGE });
  }

  const accessToken = createBookRatingAccessToken(subscriberId);
  const emailResult = await sendBookRatingAccessEmail({
    email: parsed.data.email.trim().toLowerCase(),
    bookTitle: book.title,
    bookId: book.id,
    accessToken,
  });

  if (!emailResult.ok) {
    console.error("[api/book-ratings/access] falha ao enviar link", emailResult.error);
  }

  return NextResponse.json({ message: ACCESS_MESSAGE });
}
