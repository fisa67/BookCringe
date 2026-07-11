// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require("@supabase/supabase-js");

/**
 * Fase 0 da migração do Clube de Leitura (ver auditoria em
 * bookclub-publico-auditoria.canvas.tsx): popula o Supabase com os dados
 * hoje hardcoded em `src/data/bookclub/2026.ts` — anos, meses, livros do
 * mês, conteúdos (reels) e avaliações. NÃO altera a página pública, os
 * componentes públicos, o SEO, os formulários nem a fonte de dados da
 * página (`@/data/bookclub`) — a Fase 1 (adapter de leitura) é um passo
 * separado e não é iniciada aqui.
 *
 * Os dados abaixo espelham `src/data/bookclub/2026.ts` byte a byte. Este
 * script é autônomo (não importa esse arquivo) porque `scripts/` roda em
 * Node puro, sem o runtime de TypeScript/alias `@/` do Next.js. Se
 * `2026.ts` mudar antes de rodar este script, atualize `MONTHS` abaixo
 * primeiro.
 *
 * Uso:
 *   node --env-file=.env.local scripts/backfill-bookclub-2026.js            # dry run (padrão) — só mostra o plano, não grava nada
 *   node --env-file=.env.local scripts/backfill-bookclub-2026.js --apply    # grava no Supabase (idempotente — seguro rodar de novo)
 *
 * Requer SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e
 * SUPABASE_SERVICE_ROLE_KEY no ambiente (mesmas variáveis de
 * `src/lib/supabase/client.ts`).
 */

const YEAR = 2026;

const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Espelho de src/data/bookclub/2026.ts — um livro por mês, exatamente como no arquivo original.
const MONTHS = [
  { month: 1, title: "Água Fresca para as Flores", author: "Valérie Perrin", rating: 5, instagram: "https://www.instagram.com/reel/DXHxGnppgid/", amazonUrl: "https://www.amazon.com.br/dp/8551004999", cover: "/books/agua-fresca-para-as-flores.jpg" },
  { month: 2, title: "Relatos de um Gato Viajante", author: "Hiro Arikawa", rating: 5, instagram: "https://www.instagram.com/reel/DXZx2rZgCy9/", amazonUrl: "https://www.amazon.com.br/dp/6586489148", cover: "/books/relatos-de-um-gato-viajante.jpg" },
  { month: 3, title: "Nunca Minta", author: "Freida McFadden", rating: 4, instagram: "https://www.instagram.com/reel/DZIMOBXO1vz/", amazonUrl: "https://www.amazon.com.br/dp/6557825682", cover: "/books/nunca-minta.jpg" },
  { month: 4, title: "Eu Receberia as Piores Notícias dos Seus Lindos Lábios", author: "Marçal Aquino", rating: 5, instagram: "https://www.instagram.com/reel/DZ241eqgm1U/", amazonUrl: "https://www.amazon.com.br/dp/8535934448", cover: "/books/eu-receberia-as-piores-noticias-dos-seus-lindos-labios.jpg" },
  { month: 5, title: "Evidências de uma Traição", author: "Taylor Jenkins Reid", cover: "/books/evidencias-de-uma-traicao.jpg" },
  { month: 6, title: "Kafka à Beira-Mar", author: "Haruki Murakami", cover: "/books/kafka-a-beira-mar.jpg" },
  { month: 7, title: "Sobre os Ossos dos Mortos", author: "Olga Tokarczuk", cover: "/books/sobre-os-ossos-dos-mortos.jpg" },
  { month: 8, title: "Chocolates Quentes às Quintas-feiras", author: "Durian Sukegawa", cover: "/books/chocolates-quentes-as-quintas-feiras.jpg" },
  { month: 9, title: "Cabrita da Peste", author: "Luan Barbosa", cover: "/books/cabrita-da-peste.jpg" },
  { month: 10, title: "Não Me Abandone Jamais", author: "Kazuo Ishiguro", cover: "/books/nao-me-abandone-jamais.jpg" },
  { month: 11, title: "A Vida pela Frente", author: "Romain Gary (Émile Ajar)", cover: "/books/a-vida-pela-frente.jpg" },
  { month: 12, title: "Alta Fidelidade", author: "Nick Hornby", cover: "/books/alta-fidelidade.jpg" },
];

// Idêntico a slugify() em src/lib/utils.ts — mesma convenção usada pelo admin (createBookAction).
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildPlan() {
  const years = [{ year: YEAR }];

  const months = MONTHS.map((entry) => ({
    month: entry.month,
    label: MONTH_LABELS[entry.month - 1],
    theme: null,
    notes: null,
  }));

  const books = MONTHS.map((entry) => ({
    slug: slugify(entry.title),
    title: entry.title,
    author: entry.author,
    cover_path: entry.cover,
    amazon_url: entry.amazonUrl ?? null,
  }));

  const monthBooks = MONTHS.map((entry) => ({
    month: entry.month,
    bookSlug: slugify(entry.title),
    position: 0,
  }));

  const contents = MONTHS.filter((entry) => entry.instagram).map((entry) => ({
    bookSlug: slugify(entry.title),
    bookTitle: entry.title,
    platform: "instagram",
    content_type: "reel",
    url: entry.instagram,
    is_featured: true,
  }));

  const readings = MONTHS.filter((entry) => typeof entry.rating === "number").map((entry) => ({
    bookSlug: slugify(entry.title),
    bookTitle: entry.title,
    rating: entry.rating,
    status: "finished",
  }));

  return { years, months, books, monthBooks, contents, readings };
}

function printPlan(plan) {
  console.log(`Plano de backfill — Clube de Leitura ${YEAR}\n`);

  console.log(`ANOS (${plan.years.length})`);
  for (const year of plan.years) {
    console.log(`  - bookclub_years: year=${year.year}`);
  }

  console.log(`\nMESES (${plan.months.length})`);
  for (const month of plan.months) {
    console.log(`  - bookclub_months: year=${YEAR}, month=${month.month} (${month.label}), theme=null, notes=null`);
  }

  console.log(`\nLIVROS (${plan.books.length})`);
  for (const book of plan.books) {
    console.log(
      `  - books: slug="${book.slug}", title="${book.title}", author="${book.author}", cover_path="${book.cover_path}", amazon_url=${book.amazon_url ? `"${book.amazon_url}"` : "null"}`
    );
  }

  console.log(`\nLIVROS DO MÊS (${plan.monthBooks.length})`);
  for (const link of plan.monthBooks) {
    console.log(`  - bookclub_month_books: month=${link.month} (${MONTH_LABELS[link.month - 1]}) → book_slug="${link.bookSlug}", position=${link.position}`);
  }

  console.log(`\nCONTEÚDOS (${plan.contents.length})`);
  for (const content of plan.contents) {
    console.log(
      `  - contents: book="${content.bookTitle}", platform=${content.platform}, content_type=${content.content_type}, url="${content.url}", is_featured=${content.is_featured}`
    );
  }

  console.log(`\nAVALIAÇÕES / INFORMAÇÕES COMPLEMENTARES (${plan.readings.length})`);
  for (const reading of plan.readings) {
    console.log(`  - book_readings: book="${reading.bookTitle}", rating=${reading.rating}, status=${reading.status}`);
  }

  console.log(
    `\nTotal de registros planejados: ${
      plan.years.length + plan.months.length + plan.books.length + plan.monthBooks.length + plan.contents.length + plan.readings.length
    }`
  );
  console.log(
    "\nNota: nenhum mês é marcado como \"ativo\" (metadata.is_active) por este script — isso é uma decisão\n" +
      "editorial e continua disponível no admin (/admin/bookclub) depois do backfill."
  );
}

async function upsertYear(supabase, year) {
  const { data: existing, error: selectError } = await supabase
    .from("bookclub_years")
    .select("id")
    .eq("year", year.year)
    .maybeSingle();

  if (selectError) throw new Error(`bookclub_years (select year=${year.year}): ${selectError.message}`);
  if (existing) return { id: existing.id, created: false };

  const { data, error } = await supabase
    .from("bookclub_years")
    .insert({ year: year.year, metadata: {} })
    .select("id")
    .single();

  if (error) throw new Error(`bookclub_years (insert year=${year.year}): ${error.message}`);
  return { id: data.id, created: true };
}

async function upsertMonth(supabase, yearId, month) {
  const { data: existing, error: selectError } = await supabase
    .from("bookclub_months")
    .select("id")
    .eq("year_id", yearId)
    .eq("month", month.month)
    .maybeSingle();

  if (selectError) throw new Error(`bookclub_months (select month=${month.month}): ${selectError.message}`);
  if (existing) return { id: existing.id, created: false };

  const { data, error } = await supabase
    .from("bookclub_months")
    .insert({ year_id: yearId, month: month.month, theme: month.theme, notes: month.notes, metadata: {} })
    .select("id")
    .single();

  if (error) throw new Error(`bookclub_months (insert month=${month.month}): ${error.message}`);
  return { id: data.id, created: true };
}

async function upsertBook(supabase, book) {
  const { data: existing, error: selectError } = await supabase
    .from("books")
    .select("id")
    .eq("slug", book.slug)
    .maybeSingle();

  if (selectError) throw new Error(`books (select slug=${book.slug}): ${selectError.message}`);
  if (existing) return { id: existing.id, created: false };

  const { data, error } = await supabase
    .from("books")
    .insert({
      slug: book.slug,
      title: book.title,
      author: book.author,
      cover_path: book.cover_path,
      amazon_url: book.amazon_url,
      genres: [],
      metadata: {},
    })
    .select("id")
    .single();

  if (error) throw new Error(`books (insert slug=${book.slug}): ${error.message}`);
  return { id: data.id, created: true };
}

async function upsertMonthBook(supabase, monthId, bookId, position) {
  const { data: existing, error: selectError } = await supabase
    .from("bookclub_month_books")
    .select("id")
    .eq("month_id", monthId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (selectError) throw new Error(`bookclub_month_books (select): ${selectError.message}`);
  if (existing) return { id: existing.id, created: false };

  const { data, error } = await supabase
    .from("bookclub_month_books")
    .insert({ month_id: monthId, book_id: bookId, position })
    .select("id")
    .single();

  if (error) throw new Error(`bookclub_month_books (insert): ${error.message}`);
  return { id: data.id, created: true };
}

async function upsertContent(supabase, bookId, content) {
  const { data: existing, error: selectError } = await supabase
    .from("contents")
    .select("id")
    .eq("book_id", bookId)
    .eq("platform", content.platform)
    .eq("url", content.url)
    .maybeSingle();

  if (selectError) throw new Error(`contents (select book_id=${bookId}): ${selectError.message}`);
  if (existing) return { id: existing.id, created: false };

  const { data, error } = await supabase
    .from("contents")
    .insert({
      book_id: bookId,
      platform: content.platform,
      content_type: content.content_type,
      url: content.url,
      is_featured: content.is_featured,
      metadata: {},
    })
    .select("id")
    .single();

  if (error) throw new Error(`contents (insert book_id=${bookId}): ${error.message}`);
  return { id: data.id, created: true };
}

async function upsertReading(supabase, bookId, reading) {
  const { data: existing, error: selectError } = await supabase
    .from("book_readings")
    .select("id")
    .eq("book_id", bookId)
    .maybeSingle();

  if (selectError) throw new Error(`book_readings (select book_id=${bookId}): ${selectError.message}`);
  if (existing) return { id: existing.id, created: false, skippedReason: "já existe uma leitura para este livro — não sobrescrita" };

  const { data, error } = await supabase
    .from("book_readings")
    .insert({ book_id: bookId, rating: reading.rating, status: reading.status, favorite: false, would_recommend: false, metadata: {} })
    .select("id")
    .single();

  if (error) throw new Error(`book_readings (insert book_id=${bookId}): ${error.message}`);
  return { id: data.id, created: true };
}

async function applyPlan(supabase, plan) {
  const counts = { created: 0, skipped: 0 };
  const tally = (result) => (result.created ? counts.created++ : counts.skipped++);

  const year = await upsertYear(supabase, plan.years[0]);
  tally(year);
  console.log(`bookclub_years: ${year.created ? "criado" : "já existia"} (year=${YEAR})`);

  const monthIdByNumber = new Map();
  for (const month of plan.months) {
    const result = await upsertMonth(supabase, year.id, month);
    tally(result);
    monthIdByNumber.set(month.month, result.id);
    console.log(`bookclub_months: ${result.created ? "criado" : "já existia"} (month=${month.month})`);
  }

  const bookIdBySlug = new Map();
  for (const book of plan.books) {
    const result = await upsertBook(supabase, book);
    tally(result);
    bookIdBySlug.set(book.slug, result.id);
    console.log(`books: ${result.created ? "criado" : "já existia"} (slug=${book.slug})`);
  }

  for (const link of plan.monthBooks) {
    const monthId = monthIdByNumber.get(link.month);
    const bookId = bookIdBySlug.get(link.bookSlug);
    const result = await upsertMonthBook(supabase, monthId, bookId, link.position);
    tally(result);
    console.log(`bookclub_month_books: ${result.created ? "criado" : "já existia"} (month=${link.month} → ${link.bookSlug})`);
  }

  for (const content of plan.contents) {
    const bookId = bookIdBySlug.get(content.bookSlug);
    const result = await upsertContent(supabase, bookId, content);
    tally(result);
    console.log(`contents: ${result.created ? "criado" : "já existia"} (${content.bookSlug} → ${content.platform})`);
  }

  for (const reading of plan.readings) {
    const bookId = bookIdBySlug.get(reading.bookSlug);
    const result = await upsertReading(supabase, bookId, reading);
    tally(result);
    console.log(`book_readings: ${result.created ? "criado" : result.skippedReason ?? "já existia"} (${reading.bookSlug})`);
  }

  console.log(`\nConcluído. Criados: ${counts.created}. Já existentes (sem alteração): ${counts.skipped}.`);
}

async function main() {
  const apply = process.argv.includes("--apply");
  const plan = buildPlan();

  printPlan(plan);

  if (!apply) {
    console.log("\nDry run (padrão) — nenhum dado foi gravado. Rode com --apply para gravar no Supabase.");
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      "\nSUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY são obrigatórias para --apply. Nada foi gravado."
    );
    process.exitCode = 1;
    return;
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  console.log("\nGravando no Supabase...\n");
  await applyPlan(supabase, plan);
}

main().catch((error) => {
  console.error("\nFalha no backfill:", error.message);
  process.exitCode = 1;
});
