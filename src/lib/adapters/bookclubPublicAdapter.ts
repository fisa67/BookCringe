import { bookclubCalendars } from "@/data/bookclub";
import {
  validateBookClubCalendarDefinition,
  type BookClubCalendarDefinition,
  type BookClubMonthDefinition,
  type BookClubMonthEntry,
  type BookContent,
} from "@/lib/bookclub";
import { getBookById } from "@/lib/services/bookService";
import { getReadingByBook } from "@/lib/services/bookReadingService";
import { getContentByBook } from "@/lib/services/contentService";
import {
  getBookClubMonthBooks,
  getBookClubMonths,
  getBookClubYears,
} from "@/lib/services/clubService";
import type {
  CmsBookClubMonthBookRecord,
  CmsBookClubMonthRecord,
  CmsBookClubYearRecord,
  CmsContentPlatform,
} from "@/lib/types/cms";

/**
 * Fase 1 da migração pública do Clube de Leitura (somente leitura).
 *
 * Este adapter lê do Supabase reutilizando os services já existentes do CMS
 * (`clubService`, `bookService`, `contentService`, `bookReadingService`) e
 * devolve os dados exatamente no mesmo formato de entrada consumido hoje
 * pela página pública — `BookClubCalendarDefinition[]`, o mesmo tipo de
 * `bookclubCalendars` (`src/data/bookclub`). Isso permite que, quando a
 * página trocar o import estático por `getPublicBookClubCalendars()`, toda a
 * lógica existente (`getCurrentReading`, `normalizeBookClubCalendar`,
 * `getStatusForMonth`, componentes visuais, SEO) continue funcionando sem
 * nenhuma alteração — este módulo ainda NÃO é importado pela página.
 *
 * Fallback: a comparação e a troca acontecem por ano. Se o Supabase não
 * tiver o ano, não tiver nenhum mês/livro, ou os dados não passarem em
 * `validateBookClubCalendarDefinition`, o calendário estático equivalente é
 * usado no lugar. Anos que existirem apenas no Supabase (fora do arquivo
 * estático) são incluídos normalmente.
 */

const PLATFORM_TO_CONTENT_KEY: Partial<Record<CmsContentPlatform, keyof BookContent>> = {
  instagram: "instagram",
  tiktok: "tiktok",
  youtube: "youtube",
};

async function buildContentFields(
  bookId: string
): Promise<Pick<BookClubMonthEntry, "content" | "instagram">> {
  const contents = await getContentByBook(bookId);
  if (!contents || contents.length === 0) return {};

  const chosen = contents.find((item) => item.is_featured) ?? contents[0];
  const contentKey = PLATFORM_TO_CONTENT_KEY[chosen.platform];
  if (!contentKey) return {};

  const content: BookContent = { [contentKey]: chosen.url };
  return contentKey === "instagram" ? { content, instagram: chosen.url } : { content };
}

async function buildMonthEntry(link: CmsBookClubMonthBookRecord): Promise<BookClubMonthEntry | null> {
  const book = await getBookById(link.book_id);
  if (!book) {
    console.error(`[bookclubPublicAdapter] Livro ${link.book_id} não encontrado (month_book ${link.id}).`);
    return null;
  }

  const [reading, contentFields] = await Promise.all([
    getReadingByBook(link.book_id),
    buildContentFields(link.book_id),
  ]);

  return {
    title: book.title,
    author: book.author,
    cover: book.cover_path ?? undefined,
    amazonUrl: book.amazon_url ?? undefined,
    rating: typeof reading?.rating === "number" ? reading.rating : undefined,
    ...contentFields,
  };
}

async function buildMonthDefinition(
  monthRecord: CmsBookClubMonthRecord
): Promise<BookClubMonthDefinition | null> {
  const links = await getBookClubMonthBooks(monthRecord.id);
  if (!links || links.length === 0) return null;

  // `position` ascendente define a ordem de exibição; o menor valor é o destaque.
  const sortedLinks = [...links].sort((a, b) => a.position - b.position);
  const entries = await Promise.all(sortedLinks.map(buildMonthEntry));
  const books = entries.filter((entry): entry is BookClubMonthEntry => entry !== null);
  if (books.length === 0) return null;

  return {
    month: monthRecord.month,
    theme: monthRecord.theme,
    books,
  };
}

async function buildCalendarDefinition(
  yearRecord: CmsBookClubYearRecord
): Promise<BookClubCalendarDefinition | null> {
  const monthRecords = await getBookClubMonths(yearRecord.id);
  if (!monthRecords || monthRecords.length === 0) return null;

  const months = await Promise.all(monthRecords.map(buildMonthDefinition));
  const validMonths = months.filter((month): month is BookClubMonthDefinition => month !== null);
  if (validMonths.length === 0) return null;

  return { year: yearRecord.year, months: validMonths };
}

async function fetchBookClubCalendarsFromSupabase(): Promise<BookClubCalendarDefinition[]> {
  const years = await getBookClubYears();
  if (!years || years.length === 0) return [];

  const calendars = await Promise.all(years.map(buildCalendarDefinition));
  return calendars.filter((calendar): calendar is BookClubCalendarDefinition => calendar !== null);
}

/**
 * Retorna os calendários do Clube de Leitura no formato público
 * (`BookClubCalendarDefinition[]`), priorizando os dados do Supabase e
 * caindo para o estático (`bookclubCalendars`) ano a ano quando necessário.
 *
 * Ainda não é chamada pela página pública — pronta para a próxima fase.
 */
export async function getPublicBookClubCalendars(): Promise<readonly BookClubCalendarDefinition[]> {
  let supabaseCalendars: BookClubCalendarDefinition[];

  try {
    supabaseCalendars = await fetchBookClubCalendarsFromSupabase();
  } catch (error) {
    console.error(
      "[bookclubPublicAdapter] Falha ao buscar calendários do Supabase, usando fallback estático.",
      error
    );
    return bookclubCalendars;
  }

  if (supabaseCalendars.length === 0) {
    return bookclubCalendars;
  }

  const staticYears = new Set(bookclubCalendars.map((calendar) => calendar.year));

  const merged = bookclubCalendars.map((staticCalendar) => {
    const supabaseCalendar = supabaseCalendars.find((calendar) => calendar.year === staticCalendar.year);
    if (!supabaseCalendar) return staticCalendar;

    try {
      validateBookClubCalendarDefinition(supabaseCalendar);
      return supabaseCalendar;
    } catch (error) {
      console.error(
        `[bookclubPublicAdapter] Dados do Supabase inválidos para o ano ${staticCalendar.year}, usando fallback estático.`,
        error
      );
      return staticCalendar;
    }
  });

  const extraSupabaseCalendars = supabaseCalendars.filter(
    (calendar) => !staticYears.has(calendar.year)
  );

  return [...merged, ...extraSupabaseCalendars].sort((a, b) => a.year - b.year);
}
