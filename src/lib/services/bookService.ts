import type {
  CmsBookCreate,
  CmsBookRecord,
  CmsBookUpdate,
} from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";
import { buildAmazonAffiliateUrl } from "@/lib/services/affiliateService";

const TABLE = "books";

export async function getBooks(): Promise<CmsBookRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    console.error("[bookService] getBooks error", error);
    return null;
  }

  return data;
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

export function attachBookAffiliateUrl(book: CmsBookRecord, amazonAssociateId?: string): CmsBookRecord {
  return {
    ...book,
    affiliate_url: buildAmazonAffiliateUrl(book.amazon_url, amazonAssociateId),
  };
}
