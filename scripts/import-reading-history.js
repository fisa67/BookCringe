// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require("@supabase/supabase-js");

/**
* Importação histórica de leituras 2024-2026
*
* Origem:
* backfill_24-26.csv (colunas: book_title, status, author, page_count,
* reading_time_hhmmss, rating, finished_at, country, genres, amazon_url,
* reading_time_seconds — delimitador ";").
*
* Objetivo:
* - para cada linha, localizar o livro em `books` por título+autor
* (case-insensitive); criar se não existir.
* - criar/atualizar a leitura correspondente em `book_readings`
* (status, rating, finished_at, reading_time_seconds).
* - nunca duplicar livro nem leitura ao rodar de novo (idempotente).
*
* `scripts/` roda em Node puro, sem o runtime de TypeScript/alias `@/` do
* Next.js (mesma limitação documentada em `backfill-bookclub-2026.js`).
* Por isso este arquivo não importa `src/lib/services/*` diretamente —
* ele espelha exatamente a mesma lógica/nomes de campos de
* `bookService.ts`, `bookReadingService.ts` e `lib/utils/time.ts`
* (`slugify`, `parseHhMmSsToSeconds`, o padrão create-or-update de
* `saveReading`), e usa o mesmo client (`@supabase/supabase-js`) com as
* mesmas variáveis de ambiente de `src/lib/supabase/client.ts`.
*
* Uso:
* node --env-file=.env.local scripts/import-reading-history.js --dry-run [--file=/caminho/backfill_24-26.csv]
* node --env-file=.env.local scripts/import-reading-history.js --apply [--file=/caminho/backfill_24-26.csv]
*
* Sem --file, procura "backfill_24-26.csv" no diretório atual. Sem
* --dry-run nem --apply, roda em modo dry-run (mesma convenção de
* `backfill-bookclub-2026.js`) — nada é gravado a menos que --apply seja
* passado explicitamente.
*
* Requer SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e
* SUPABASE_SERVICE_ROLE_KEY no ambiente — só para --apply.
*/

const REQUIRED_COLUMNS = [
"book_title",
"status",
"author",
"page_count",
"reading_time_hhmmss",
"rating",
"finished_at",
"country",
"genres",
"amazon_url",
"reading_time_seconds",
];

// CSV → status persistido em book_readings.status. "Planned" no CSV
// (shelf "Quero Ler") mapeia para o default do schema (`not_started`,
// ver 20260708_initial_schema.sql) em vez de inventar um status novo.
const STATUS_MAP = {
finished: "finished",
reading: "reading",
planned: "not_started",
};

// Idêntico a slugify() em src/lib/utils.ts.
function slugify(text) {
return text
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/[^a-z0-9]+/g, "-")
.replace(/(^-|-$)/g, "");
}

// Idêntico a parseHhMmSsToSeconds() em src/lib/utils/time.ts.
function parseHhMmSsToSeconds(value) {
if (!value) return null;
const match = /^(\d+):([0-5]\d):([0-5]\d)$/.exec(String(value).trim());
if (!match) return null;
const [, hours, minutes, seconds] = match;
return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function parseArgs(argv) {
const apply = argv.includes("--apply");
const dryRun = argv.includes("--dry-run");

if (apply && dryRun) {
throw new Error("Use apenas --dry-run OU --apply, não os dois.");
}

const fileArg = argv.find((arg) => arg.startsWith("--file="));
const file = fileArg
? path.resolve(process.cwd(), fileArg.slice("--file=".length))
: path.resolve(process.cwd(), "backfill_24-26.csv");

return { apply, file };
}

/**
* Decodifica o arquivo tentando UTF-8 estrito primeiro; se falhar (arquivo
* salvo por um app que usa a codificação legada do macOS — foi o caso do
* `backfill_24-26.csv` original, com acentos corrompidos em UTF-8/Latin-1),
* cai para "macintosh" (suportada nativamente pelo `TextDecoder` do Node
* via ICU — sem precisar de nenhuma dependência nova).
*/
function readCsvText(filePath) {
const buffer = fs.readFileSync(filePath);

try {
return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
} catch {
return new TextDecoder("macintosh").decode(buffer);
}
}

/**
* Parser mínimo para este CSV específico (delimitador ";", sem campos
* entre aspas — confirmado na auditoria do arquivo original). Não é um
* parser CSV genérico: não trata aspas nem delimitador escapado.
*/
function parseCsv(text) {
const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
if (lines.length === 0) {
throw new Error("Arquivo CSV vazio.");
}

const header = lines[0].split(";").map((cell) => cell.trim());
const normalizedHeader = header.map((cell) => cell.toLowerCase());

const missing = REQUIRED_COLUMNS.filter((col) => !normalizedHeader.includes(col));
if (missing.length > 0) {
throw new Error(`Colunas obrigatórias ausentes no CSV: ${missing.join(", ")}`);
}

const rows = lines.slice(1).map((line, index) => {
const cells = line.split(";");
const record = { __line: index + 2 }; // 1-based, +1 pela linha de header
normalizedHeader.forEach((key, i) => {
record[key] = (cells[i] ?? "").trim();
});
return record;
});

return rows;
}

function parseRating(raw) {
const value = (raw ?? "").trim();
if (!value) return { value: undefined, error: null };

const parsed = Number(value.replace(",", "."));
if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
return { value: undefined, error: `rating inválido: "${raw}" (esperado 0–5)` };
}

return { value: parsed, error: null };
}

/**
* Aceita "DD/MM/YYYY" (formato original do CSV) e "YYYY-MM-DD" (formato
* que o arquivo passou a usar após reedição). Para status diferente de
* "finished", a coluna `finished_at` do CSV contém um rótulo de estante
* ("Lendo", "Quero Ler") em vez de data — nunca tentamos parsear como
* data nesse caso.
*/
function parseFinishedAt(raw, mappedStatus) {
if (mappedStatus !== "finished") return { value: undefined, error: null };

const value = (raw ?? "").trim();
if (!value) return { value: undefined, error: null };

const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
if (iso) return { value, error: null };

const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
if (br) return { value: `${br[3]}-${br[2]}-${br[1]}`, error: null };

return { value: undefined, error: `finished_at inválido: "${raw}" (esperado DD/MM/YYYY ou YYYY-MM-DD)` };
}

function parsePageCount(raw) {
const value = (raw ?? "").trim();
if (!value) return undefined;
const parsed = Number(value);
return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseGenres(raw) {
return (raw ?? "")
.split(",")
.map((genre) => genre.trim())
.filter(Boolean);
}

function resolveReadingTimeSeconds(row) {
const rawSeconds = (row.reading_time_seconds ?? "").trim();
if (/^\d+$/.test(rawSeconds)) return Number(rawSeconds);

const fromHhMmSs = parseHhMmSsToSeconds(row.reading_time_hhmmss);
return fromHhMmSs ?? undefined;
}

function mapStatus(raw) {
const key = (raw ?? "").trim().toLowerCase();
return STATUS_MAP[key] ?? key;
}

function normalizeKey(title, author) {
return `${title.trim().toLowerCase()}::${author.trim().toLowerCase()}`;
}

/**
* Constrói o plano de importação (puro, sem I/O) a partir das linhas do
* CSV e do estado atual do Supabase (livros e leituras já existentes),
* para que dry-run e apply produzam exatamente a mesma decisão por linha.
*/
function buildPlan(rows, existingBooksByKey) {
const usedSlugs = new Set();
for (const book of existingBooksByKey.values()) {
usedSlugs.add(book.slug);
}

const plannedBookSlugs = new Map(); // normalizeKey -> slug reservado nesta execução
const items = [];
const errors = [];

for (const row of rows) {
const title = (row.book_title ?? "").trim();
const author = (row.author ?? "").trim();

if (!title || !author) {
errors.push({
line: row.__line,
title: title || "(vazio)",
author: author || "(vazio)",
message: "book_title e author são obrigatórios — linha ignorada.",
});
continue;
}

const key = normalizeKey(title, author);
const status = mapStatus(row.status);
const ratingResult = parseRating(row.rating);
const finishedAtResult = parseFinishedAt(row.finished_at, status);
const readingTimeSeconds = resolveReadingTimeSeconds(row);

for (const result of [ratingResult, finishedAtResult]) {
if (result.error) {
errors.push({ line: row.__line, title, author, message: result.error });
}
}

if (row.status && !(row.status.trim().toLowerCase() in STATUS_MAP)) {
errors.push({
line: row.__line,
title,
author,
message: `status desconhecido: "${row.status}" — gravado em minúsculas sem mapeamento.`,
});
}

const existingBook = existingBooksByKey.get(key);
let bookAction;

if (existingBook) {
bookAction = { type: "reuse", id: existingBook.id, slug: existingBook.slug };
} else {
let slug = slugify(title);
let suffix = 2;
while (usedSlugs.has(slug) || plannedBookSlugs.get(key) === slug) {
slug = `${slugify(title)}-${suffix}`;
suffix += 1;
}
usedSlugs.add(slug);
plannedBookSlugs.set(key, slug);

bookAction = {
type: "create",
slug,
payload: {
slug,
title,
author,
page_count: parsePageCount(row.page_count),
country: (row.country ?? "").trim() || undefined,
genres: parseGenres(row.genres),
amazon_url: (row.amazon_url ?? "").trim() || undefined,
},
};
}

const readingPayloadBase = {
status,
rating: ratingResult.value,
finished_at: finishedAtResult.value,
reading_time_seconds:
typeof readingTimeSeconds === "number" ? String(readingTimeSeconds) : undefined,
};

items.push({ line: row.__line, title, author, key, bookAction, readingPayloadBase });
}

return { items, errors };
}

async function fetchExistingBooksByKey(supabase) {
const { data, error } = await supabase.from("books").select("id, slug, title, author");
if (error) throw new Error(`books (select): ${error.message}`);

const map = new Map();
for (const book of data ?? []) {
map.set(normalizeKey(book.title, book.author), { id: book.id, slug: book.slug });
}
return map;
}

async function fetchExistingReadingsByBookId(supabase) {
const { data, error } = await supabase.from("book_readings").select("id, book_id, reading_time_seconds");
if (error) throw new Error(`book_readings (select): ${error.message}`);

const map = new Map();
for (const reading of data ?? []) {
map.set(reading.book_id, reading);
}
return map;
}

async function createBook(supabase, payload) {
const { data, error } = await supabase
.from("books")
.insert({ ...payload, genres: payload.genres ?? [] })
.select("id")
.single();

if (error) throw new Error(`books (insert slug=${payload.slug}): ${error.message}`);
return data.id;
}

/**
* Espelha o padrão create-or-update de `saveReading` em
* `bookReadingService.ts`: uma leitura por livro (`book_id`), criada se
* não existir, atualizada em caso contrário. `reading_time_seconds`
* ausente no payload preserva o valor já salvo (mesma regra defensiva de
* `completionService.finalizeBookReading` — nunca apaga o tempo de
* leitura só porque uma linha do CSV não o informou).
*/
async function upsertReading(supabase, bookId, readingPayloadBase, existingReading) {
const payload = {
book_id: bookId,
status: readingPayloadBase.status,
rating: readingPayloadBase.rating,
finished_at: readingPayloadBase.finished_at,
reading_time_seconds:
readingPayloadBase.reading_time_seconds ?? existingReading?.reading_time_seconds ?? undefined,
favorite: false,
would_recommend: false,
metadata: {},
};

if (existingReading) {
const { error } = await supabase.from("book_readings").update(payload).eq("id", existingReading.id);
if (error) throw new Error(`book_readings (update book_id=${bookId}): ${error.message}`);
return { action: "updated" };
}

const { error } = await supabase.from("book_readings").insert(payload);
if (error) throw new Error(`book_readings (insert book_id=${bookId}): ${error.message}`);
return { action: "created" };
}

function printRowPreview(item, existingReadingByBookId) {
const bookLabel =
item.bookAction.type === "reuse"
? `livro reaproveitado (slug="${item.bookAction.slug}")`
: `livro NOVO (slug="${item.bookAction.slug}")`;

const existingReading =
item.bookAction.type === "reuse" ? existingReadingByBookId.get(item.bookAction.id) : undefined;
const readingLabel = existingReading ? "leitura ATUALIZADA" : "leitura NOVA";

console.log(
` [linha ${item.line}] "${item.title}" — ${item.author} → ${bookLabel}; ${readingLabel} ` +
`(status=${item.readingPayloadBase.status}, rating=${item.readingPayloadBase.rating ?? "—"}, ` +
`finished_at=${item.readingPayloadBase.finished_at ?? "—"}, ` +
`reading_time_seconds=${item.readingPayloadBase.reading_time_seconds ?? "—"})`
);
}

function printErrors(errors) {
if (errors.length === 0) return;
console.log(`\nAVISOS/ERROS (${errors.length})`);
for (const err of errors) {
console.log(` [linha ${err.line}] "${err.title}" — ${err.author}: ${err.message}`);
}
}

function printSummary(counts, errors) {
console.log("\nResumo");
console.log(` Livros criados: ${counts.booksCreated}`);
console.log(` Livros reaproveitados: ${counts.booksReused}`);
console.log(` Leituras criadas: ${counts.readingsCreated}`);
console.log(` Leituras atualizadas: ${counts.readingsUpdated}`);
console.log(` Erros encontrados: ${errors.length}`);
}

async function main() {
const { apply, file } = parseArgs(process.argv.slice(2));

if (!fs.existsSync(file)) {
throw new Error(
`Arquivo CSV não encontrado: ${file}\nPasse o caminho explicitamente com --file=/caminho/backfill_24-26.csv`
);
}

console.log(`Lendo CSV: ${file}`);
const text = readCsvText(file);
const rows = parseCsv(text);
console.log(`${rows.length} linha(s) de dados encontradas.\n`);

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
throw new Error(
"SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY são obrigatórias " +
"(inclusive em --dry-run, para comparar o CSV com o estado atual do banco). " +
"Rode com: node --env-file=.env.local scripts/import-reading-history.js"
);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const [existingBooksByKey, existingReadingsByBookId] = await Promise.all([
fetchExistingBooksByKey(supabase),
fetchExistingReadingsByBookId(supabase),
]);

const { items, errors } = buildPlan(rows, existingBooksByKey);

console.log(apply ? "Plano (será executado):\n" : "Plano (dry-run — nada será gravado):\n");
for (const item of items) {
printRowPreview(item, existingReadingsByBookId);
}
printErrors(errors);

const counts = { booksCreated: 0, booksReused: 0, readingsCreated: 0, readingsUpdated: 0 };
for (const item of items) {
if (item.bookAction.type === "reuse") counts.booksReused += 1;
else counts.booksCreated += 1;
}

if (!apply) {
printSummary(counts, errors);
console.log(
"\nDry run — nenhum dado foi gravado. Rode com --apply para gravar no Supabase " +
"(idempotente — seguro rodar de novo)."
);
return;
}

console.log("\nGravando no Supabase...\n");
const applyCounts = { booksCreated: 0, booksReused: 0, readingsCreated: 0, readingsUpdated: 0 };
const applyErrors = [...errors];

for (const item of items) {
try {
let bookId;
if (item.bookAction.type === "reuse") {
bookId = item.bookAction.id;
applyCounts.booksReused += 1;
} else {
bookId = await createBook(supabase, item.bookAction.payload);
applyCounts.booksCreated += 1;
// Registra o livro recém-criado para as próximas linhas desta
// mesma execução (evita duas linhas do CSV criarem o livro duas
// vezes, ainda que a auditoria não tenha encontrado título+autor
// repetido no arquivo original).
existingBooksByKey.set(item.key, { id: bookId, slug: item.bookAction.slug });
}

const existingReading = existingReadingsByBookId.get(bookId);
const result = await upsertReading(supabase, bookId, item.readingPayloadBase, existingReading);
if (result.action === "created") applyCounts.readingsCreated += 1;
else applyCounts.readingsUpdated += 1;
} catch (error) {
applyErrors.push({
line: item.line,
title: item.title,
author: item.author,
message: error.message,
});
console.error(` [linha ${item.line}] ERRO: "${item.title}" — ${item.author}: ${error.message}`);
}
}

printSummary(applyCounts, applyErrors);
}

main().catch((error) => {
console.error("\nFalha na importação:", error.message);
process.exitCode = 1;
});