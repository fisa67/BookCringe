import type { CmsBookRatingRecord } from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const RATINGS_TABLE = "book_ratings" as const;
const BOOKS_TABLE = "books" as const;
const SUBSCRIBERS_TABLE = "newsletter_subscribers" as const;

export interface PublicBookRating {
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicBookRatingSummary {
  average: number | null;
  count: number;
  ratings: PublicBookRating[];
}

export interface SaveBookRatingInput {
  bookId: string;
  subscriberId: string;
  rating: number;
  comment: string | null;
}

export type SaveBookRatingResult =
  | { ok: true; rating: CmsBookRatingRecord }
  | { ok: false; reason: "not-confirmed" | "database" };

export interface AdminBookRating {
  id: string;
  bookId: string;
  bookTitle: string;
  bookSlug: string;
  subscriberEmail: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPublicBookRatingSummary(
  bookId: string
): Promise<PublicBookRatingSummary | null> {
  const [allResult, latestResult] = await Promise.all([
    supabaseAdminClient.from(RATINGS_TABLE).select("rating").eq("book_id", bookId),
    supabaseAdminClient
      .from(RATINGS_TABLE)
      .select("rating, comment, created_at, updated_at")
      .eq("book_id", bookId)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  if (allResult.error || latestResult.error) {
    console.error(
      "[bookRatingService] getPublicBookRatingSummary error",
      allResult.error ?? latestResult.error
    );
    return null;
  }

  const count = allResult.data.length;
  const average =
    count > 0
      ? Math.round((allResult.data.reduce((sum, item) => sum + item.rating, 0) / count) * 10) / 10
      : null;

  return {
    average,
    count,
    ratings: latestResult.data,
  };
}

export async function saveBookRating(
  input: SaveBookRatingInput
): Promise<SaveBookRatingResult> {
  const { data: subscriber, error: subscriberError } = await supabaseAdminClient
    .from(SUBSCRIBERS_TABLE)
    .select("id")
    .eq("id", input.subscriberId)
    .not("confirmed_at", "is", null)
    .maybeSingle();

  if (subscriberError) {
    console.error("[bookRatingService] find confirmed subscriber error", subscriberError);
    return { ok: false, reason: "database" };
  }

  if (!subscriber) {
    return { ok: false, reason: "not-confirmed" };
  }

  const { data, error } = await supabaseAdminClient
    .from(RATINGS_TABLE)
    .upsert(
      {
        book_id: input.bookId,
        subscriber_id: input.subscriberId,
        rating: input.rating,
        comment: input.comment,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "subscriber_id,book_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[bookRatingService] saveBookRating error", error);
    return { ok: false, reason: "database" };
  }

  return { ok: true, rating: data };
}

export async function getConfirmedSubscriberIdByEmail(
  email: string
): Promise<string | null> {
  const { data, error } = await supabaseAdminClient
    .from(SUBSCRIBERS_TABLE)
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .not("confirmed_at", "is", null)
    .maybeSingle();

  if (error) {
    console.error(
      "[bookRatingService] getConfirmedSubscriberIdByEmail error",
      error
    );
    return null;
  }

  return data?.id ?? null;
}

export async function getAdminBookRatings(): Promise<AdminBookRating[] | null> {
  const [ratingsResult, booksResult, subscribersResult] = await Promise.all([
    supabaseAdminClient
      .from(RATINGS_TABLE)
      .select("*")
      .order("updated_at", { ascending: false }),
    supabaseAdminClient.from(BOOKS_TABLE).select("id, title, slug"),
    supabaseAdminClient.from(SUBSCRIBERS_TABLE).select("id, email"),
  ]);

  if (ratingsResult.error || booksResult.error || subscribersResult.error) {
    console.error(
      "[bookRatingService] getAdminBookRatings error",
      ratingsResult.error ?? booksResult.error ?? subscribersResult.error
    );
    return null;
  }

  const booksById = new Map(booksResult.data.map((book) => [book.id, book]));
  const subscribersById = new Map(
    subscribersResult.data.map((subscriber) => [subscriber.id, subscriber])
  );

  return ratingsResult.data.map((rating) => ({
    id: rating.id,
    bookId: rating.book_id,
    bookTitle: booksById.get(rating.book_id)?.title ?? "Livro não encontrado",
    bookSlug: booksById.get(rating.book_id)?.slug ?? "",
    subscriberEmail: subscribersById.get(rating.subscriber_id)?.email ?? "Leitor não encontrado",
    rating: rating.rating,
    comment: rating.comment,
    created_at: rating.created_at,
    updated_at: rating.updated_at,
  }));
}

export async function deleteBookRating(id: string): Promise<boolean> {
  const { error } = await supabaseAdminClient.from(RATINGS_TABLE).delete().eq("id", id);

  if (error) {
    console.error("[bookRatingService] deleteBookRating error", error);
    return false;
  }

  return true;
}
