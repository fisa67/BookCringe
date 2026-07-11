import type {
  CmsBookClubMonthBookRecord,
  CmsBookClubMonthRecord,
  CmsBookClubYearRecord,
} from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const YEARS_TABLE = "bookclub_years";
const MONTHS_TABLE = "bookclub_months";
const MONTH_BOOKS_TABLE = "bookclub_month_books";

export async function getBookClubYearsCount(): Promise<number | null> {
  const { count, error } = await supabaseAdminClient
    .from(YEARS_TABLE)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[clubService] getBookClubYearsCount error", error);
    return null;
  }

  return count;
}

export async function getBookClubMonthsCount(): Promise<number | null> {
  const { count, error } = await supabaseAdminClient
    .from(MONTHS_TABLE)
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[clubService] getBookClubMonthsCount error", error);
    return null;
  }

  return count;
}

export async function getBookClubYears(): Promise<CmsBookClubYearRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(YEARS_TABLE)
    .select("*")
    .order("year", { ascending: false });

  if (error) {
    console.error("[clubService] getBookClubYears error", error);
    return null;
  }

  return data;
}

export async function getBookClubYearById(id: string): Promise<CmsBookClubYearRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(YEARS_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[clubService] getBookClubYearById error", error);
    return null;
  }

  return data;
}

export async function getBookClubMonths(yearId: string): Promise<CmsBookClubMonthRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(MONTHS_TABLE)
    .select("*")
    .eq("year_id", yearId)
    .order("month", { ascending: true });

  if (error) {
    console.error("[clubService] getBookClubMonths error", error);
    return null;
  }

  return data;
}

export async function getBookClubMonthById(id: string): Promise<CmsBookClubMonthRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(MONTHS_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[clubService] getBookClubMonthById error", error);
    return null;
  }

  return data;
}

export async function getBookClubMonthBooks(monthId: string): Promise<CmsBookClubMonthBookRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(MONTH_BOOKS_TABLE)
    .select("*")
    .eq("month_id", monthId)
    .order("position", { ascending: true });

  if (error) {
    console.error("[clubService] getBookClubMonthBooks error", error);
    return null;
  }

  return data;
}

export async function createBookClubYear(payload: Omit<CmsBookClubYearRecord, "id" | "created_at" | "updated_at">): Promise<CmsBookClubYearRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(YEARS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[clubService] createBookClubYear error", error);
    return null;
  }

  return data;
}

export async function createBookClubMonth(payload: Omit<CmsBookClubMonthRecord, "id" | "created_at" | "updated_at">): Promise<CmsBookClubMonthRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(MONTHS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[clubService] createBookClubMonth error", error);
    return null;
  }

  return data;
}

export async function createBookClubMonthBook(payload: Omit<CmsBookClubMonthBookRecord, "id" | "created_at" | "updated_at">): Promise<CmsBookClubMonthBookRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(MONTH_BOOKS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[clubService] createBookClubMonthBook error", error);
    return null;
  }

  return data;
}

export async function updateBookClubYear(
  payload: Partial<CmsBookClubYearRecord> & { id: string }
): Promise<CmsBookClubYearRecord | null> {
  const { id, ...changes } = payload;
  const { data, error } = await supabaseAdminClient
    .from(YEARS_TABLE)
    .update(changes)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[clubService] updateBookClubYear error", error);
    return null;
  }

  return data;
}

export async function deleteBookClubYear(id: string): Promise<boolean> {
  const { error } = await supabaseAdminClient.from(YEARS_TABLE).delete().eq("id", id);

  if (error) {
    console.error("[clubService] deleteBookClubYear error", error);
    return false;
  }

  return true;
}

export async function updateBookClubMonth(
  payload: Partial<CmsBookClubMonthRecord> & { id: string }
): Promise<CmsBookClubMonthRecord | null> {
  const { id, ...changes } = payload;
  const { data, error } = await supabaseAdminClient
    .from(MONTHS_TABLE)
    .update(changes)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[clubService] updateBookClubMonth error", error);
    return null;
  }

  return data;
}

export async function deleteBookClubMonth(id: string): Promise<boolean> {
  const { error } = await supabaseAdminClient.from(MONTHS_TABLE).delete().eq("id", id);

  if (error) {
    console.error("[clubService] deleteBookClubMonth error", error);
    return false;
  }

  return true;
}

/**
 * Marca `monthId` como o mês ativo do clube e desmarca qualquer outro mês
 * (de qualquer ano) que estivesse marcado — garante que exista, no máximo,
 * um mês ativo por vez. Não existe coluna dedicada para isso no schema
 * (ver migrations); o estado é guardado em `metadata.is_active`, preservando
 * as demais chaves (`start_date`, `end_date` etc.) de cada mês.
 */
export async function setActiveBookClubMonth(monthId: string): Promise<boolean> {
  const years = await getBookClubYears();
  if (!years) return false;

  const monthLists = await Promise.all(years.map((year) => getBookClubMonths(year.id)));
  const allMonths = monthLists.flatMap((list) => list ?? []);

  const previouslyActive = allMonths.filter(
    (month) => month.id !== monthId && month.metadata?.is_active === true
  );

  for (const month of previouslyActive) {
    const restMetadata = Object.fromEntries(
      Object.entries(month.metadata).filter(([key]) => key !== "is_active")
    );
    const { error } = await supabaseAdminClient
      .from(MONTHS_TABLE)
      .update({ metadata: restMetadata })
      .eq("id", month.id);

    if (error) {
      console.error("[clubService] setActiveBookClubMonth (unset previous) error", error);
      return false;
    }
  }

  const target = allMonths.find((month) => month.id === monthId) ?? (await getBookClubMonthById(monthId));
  if (!target) return false;

  const { error } = await supabaseAdminClient
    .from(MONTHS_TABLE)
    .update({ metadata: { ...target.metadata, is_active: true } })
    .eq("id", monthId);

  if (error) {
    console.error("[clubService] setActiveBookClubMonth error", error);
    return false;
  }

  return true;
}

export async function updateBookClubMonthBook(
  payload: Partial<CmsBookClubMonthBookRecord> & { id: string }
): Promise<CmsBookClubMonthBookRecord | null> {
  const { id, ...changes } = payload;
  const { data, error } = await supabaseAdminClient
    .from(MONTH_BOOKS_TABLE)
    .update(changes)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[clubService] updateBookClubMonthBook error", error);
    return null;
  }

  return data;
}

export async function deleteBookClubMonthBook(id: string): Promise<boolean> {
  const { error } = await supabaseAdminClient.from(MONTH_BOOKS_TABLE).delete().eq("id", id);

  if (error) {
    console.error("[clubService] deleteBookClubMonthBook error", error);
    return false;
  }

  return true;
}

/**
 * Torna `monthBookId` o livro destaque do mês: não há coluna "featured" —
 * o destaque é, por convenção, o livro com a menor `position` (a mesma
 * ordenação usada por `getBookClubMonthBooks`). Não há constraint de
 * unicidade em `position`, então um único update é suficiente e seguro.
 */
export async function setFeaturedBookClubMonthBook(monthId: string, monthBookId: string): Promise<boolean> {
  const books = await getBookClubMonthBooks(monthId);
  if (!books) return false;

  const minPosition = books.reduce((min, book) => Math.min(min, book.position), 0);

  const { error } = await supabaseAdminClient
    .from(MONTH_BOOKS_TABLE)
    .update({ position: minPosition - 1 })
    .eq("id", monthBookId);

  if (error) {
    console.error("[clubService] setFeaturedBookClubMonthBook error", error);
    return false;
  }

  return true;
}
