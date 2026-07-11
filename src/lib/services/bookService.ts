import type {
  CmsBookCreate,
  CmsBookRecord,
  CmsBookUpdate,
} from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";
import { buildAmazonAffiliateUrl } from "@/lib/services/affiliateService";

const TABLE = "books";

export interface GetBooksFilters {
  title?: string;
  author?: string;
}

/**
 * Lista livros, com filtros opcionais por título e autor (busca parcial,
 * case-insensitive) — usados pela listagem do admin (`/admin/books`).
 * Sem filtros, mantém o comportamento anterior (todos os livros, por título).
 */
export async function getBooks(filters: GetBooksFilters = {}): Promise<CmsBookRecord[] | null> {
  let query = supabaseAdminClient.from(TABLE).select("*").order("title", { ascending: true });

  if (filters.title) {
    query = query.ilike("title", `%${filters.title}%`);
  }

  if (filters.author) {
    query = query.ilike("author", `%${filters.author}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[bookService] getBooks error", error);
    return null;
  }

  return data;
}

export async function getBooksCount(): Promise<number | null> {
  const { count, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[bookService] getBooksCount error", error);
    return null;
  }

  return count;
}

export async function getBookById(id: string): Promise<CmsBookRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[bookService] getBookById error", error);
    return null;
  }

  return data;
}

export async function createBook(payload: CmsBookCreate): Promise<CmsBookRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .insert({ ...payload, genres: payload.genres ?? [] })
    .select()
    .single();

  if (error) {
    console.error("[bookService] createBook error", error);
    return null;
  }

  return data;
}

export async function updateBook(payload: CmsBookUpdate): Promise<CmsBookRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .update({ ...payload })
    .eq("id", payload.id)
    .select()
    .single();

  if (error) {
    console.error("[bookService] updateBook error", error);
    return null;
  }

  return data;
}

export async function deleteBook(id: string): Promise<boolean> {
  const { error } = await supabaseAdminClient.from(TABLE).delete().eq("id", id);

  if (error) {
    console.error("[bookService] deleteBook error", error);
    return false;
  }

  return true;
}

export function attachBookAffiliateUrl(book: CmsBookRecord, amazonAssociateId?: string): CmsBookRecord {
  return {
    ...book,
    affiliate_url: buildAmazonAffiliateUrl(book.amazon_url, amazonAssociateId),
  };
}
