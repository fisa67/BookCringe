import { NextResponse } from "next/server";
import { getBookById } from "@/lib/services/bookService";
import {
  BOOK_RATING_ACCESS_COOKIE,
  BOOK_RATING_ACCESS_TTL_SECONDS,
  verifyBookRatingAccessToken,
} from "@/lib/services/bookRatingAccessToken";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const bookId = url.searchParams.get("bookId") ?? "";
  const subscriberId = verifyBookRatingAccessToken(token);

  if (!subscriberId) {
    return NextResponse.redirect(new URL("/crew-literario", request.url));
  }

  const book = await getBookById(bookId);
  if (!book) {
    return NextResponse.redirect(new URL("/biblioteca", request.url));
  }

  const response = NextResponse.redirect(
    new URL(`/livro/${book.slug}#community-ratings-title`, request.url)
  );
  response.cookies.set(BOOK_RATING_ACCESS_COOKIE, token, {
    httpOnly: true,
    maxAge: BOOK_RATING_ACCESS_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
