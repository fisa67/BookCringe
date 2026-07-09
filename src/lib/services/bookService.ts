import type {
  CmsBookCreate,
  CmsBookRecord,
  CmsBookUpdate,
} from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const TABLE = "books";

export async function getBooks(): Promise<CmsBookRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from<CmsBookRecord>(TABLE)
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
    .from<CmsBookRecord>(TABLE)
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
    .from<CmsBookRecord>(TABLE)
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
    .from<CmsBookRecord>(TABLE)
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
