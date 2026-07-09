import type {
  CmsContentRecord,
} from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const TABLE = "contents";

export async function getContentByBook(bookId: string): Promise<CmsContentRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from<CmsContentRecord>(TABLE)
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
    .from<CmsContentRecord>(TABLE)
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
    .from<CmsContentRecord>(TABLE)
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
