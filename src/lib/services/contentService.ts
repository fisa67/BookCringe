import type {
  CmsContentCategory,
  CmsContentPlatform,
  CmsContentRecord,
  CmsContentType,
} from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const TABLE = "contents";

export async function getContentsCount(): Promise<number | null> {
  const { count, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[contentService] getContentsCount error", error);
    return null;
  }

  return count;
}

export type GetContentsSort = "recent" | "oldest" | "featured";

export interface GetContentsFilters {
  bookId?: string;
  /** Filtra por múltiplos livros — usado pela busca por título/autor (via bookService, na página). */
  bookIds?: string[];
  platform?: CmsContentPlatform;
  contentType?: CmsContentType;
  contentCategory?: CmsContentCategory;
  /** Busca parcial, case-insensitive, no link (`url`). */
  search?: string;
  sort?: GetContentsSort;
}

/**
 * Lista conteúdos, com filtros e ordenação opcionais — usado pela listagem
 * do admin (`/admin/content`). Sem filtros, mantém o comportamento anterior
 * de `getContentByBook` (mais recentes primeiro), mas para todos os livros.
 */
export async function getContents(filters: GetContentsFilters = {}): Promise<CmsContentRecord[] | null> {
  let query = supabaseAdminClient.from(TABLE).select("*");

  if (filters.bookId) {
    query = query.eq("book_id", filters.bookId);
  }

  if (filters.bookIds) {
    query = query.in("book_id", filters.bookIds);
  }

  if (filters.platform) {
    query = query.eq("platform", filters.platform);
  }

  if (filters.contentType) {
    query = query.eq("content_type", filters.contentType);
  }

  if (filters.contentCategory) {
    query = query.eq("content_category", filters.contentCategory);
  }

  if (filters.search) {
    query = query.ilike("url", `%${filters.search}%`);
  }

  if (filters.sort === "oldest") {
    query = query.order("published_at", { ascending: true, nullsFirst: false });
  } else if (filters.sort === "featured") {
    query = query
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("published_at", { ascending: false, nullsFirst: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("[contentService] getContents error", error);
    return null;
  }

  return data;
}

export async function getContentById(id: string): Promise<CmsContentRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[contentService] getContentById error", error);
    return null;
  }

  return data;
}

export async function getContentByBook(bookId: string): Promise<CmsContentRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .select("*")
    .eq("book_id", bookId)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[contentService] getContentByBook error", error);
    return null;
  }

  return data;
}

export async function createContent(payload: Omit<CmsContentRecord, "id" | "created_at" | "updated_at">): Promise<CmsContentRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[contentService] createContent error", error);
    return null;
  }

  return data;
}

export async function updateContent(payload: Partial<CmsContentRecord> & { id: string }): Promise<CmsContentRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .update(payload)
    .eq("id", payload.id)
    .select()
    .single();

  if (error) {
    console.error("[contentService] updateContent error", error);
    return null;
  }

  return data;
}

export async function deleteContent(id: string): Promise<boolean> {
  const { error } = await supabaseAdminClient.from(TABLE).delete().eq("id", id);

  if (error) {
    console.error("[contentService] deleteContent error", error);
    return false;
  }

  return true;
}
