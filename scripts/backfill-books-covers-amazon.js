// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require("@supabase/supabase-js");

/**
 * Backfill de enriquecimento de `books` — capa e link da Amazon.
 *
 * Objetivo:
 * - a partir de uma lista (CSV) com título do livro + nome do arquivo da
 *   capa + amazon_url, atualizar `books.cover_path` e `books.amazon_url`
 *   dos livros JÁ CADASTRADOS.
 * - `cover_path` é gravado no formato "/books/covers/nome-da-capa.jpg"
 *   (mesma convenção de `public/books/covers/`, servido estaticamente
 *   pelo Next.js — ver `next.config.ts`/`isDisplayableCoverPath` em
 *   `src/lib/utils.ts` para paths relativos iniciados por "/").
 *
 * GARANTIAS DE SEGURANÇA (por desenho, não apenas por convenção):
 * - Este arquivo NUNCA chama `.insert()` em lugar nenhum — apenas
 *   `.select()` (leitura) e `.update()` (escrita). Nenhum livro novo é
 *   criado, mesmo que o título da planilha não exista no banco.
 * - O match é feito por título NORMALIZADO (acentos, caixa e pontuação
 *   ignorados — ver `normalizeTitle`) e precisa ser único: se o título
 *   não bate com nenhum livro, ou bate com mais de um, a linha NÃO é
 *   alterada — só entra no relatório (`notFound`/`ambiguous`).
 * - Dry-run por padrão (mesma convenção de `backfill-bookclub-2026.js` e
 *   `import-reading-history.js`): nada é gravado sem `--apply` explícito.
 *
 * Entrada esperada (CSV, delimitador ";" ou "," — auto-detectado pela
 * primeira linha):
 *   título;nome_da_capa;amazon_url
 *   Kafka à Beira-Mar;kafka-a-beira-mar.jpg;https://www.amazon.com.br/dp/...
 *
 * Nomes de coluna aceitos (case/acento-insensitive, ver *_ALIASES abaixo):
 *   título:      title, titulo, título, book_title, nome, livro
 *   capa:        cover_filename, cover_file, cover, capa, nome_capa,
 *                nome_da_capa, arquivo_capa, arquivo_da_capa, cover_path
 *   amazon_url:  amazon_url, amazon, url_amazon, link_amazon, url
 *
 * Linhas podem ter só capa, só amazon_url, ou os dois — cada coluna é
 * atualizada independentemente quando presente (enriquecimento parcial).
 * Título é a única coluna obrigatória em toda linha.
 *
 * Uso:
 *   node --env-file=.env.local scripts/backfill-books-covers-amazon.js --dry-run [--file=/caminho/planilha.csv] [--covers-dir=/caminho/public/books/covers]
 *   node --env-file=.env.local scripts/backfill-books-covers-amazon.js --apply   [--file=/caminho/planilha.csv] [--covers-dir=/caminho/public/books/covers]
 *
 * Sem --file, procura "books-covers-amazon.csv" no diretório atual. Sem
 * --dry-run nem --apply, roda em modo dry-run. `--covers-dir` é opcional
 * e só usado para AVISAR (não bloquear) quando o arquivo de capa citado
 * na planilha não existe fisicamente em `public/books/covers` — por
 * padrão aponta para `<cwd>/public/books/covers`.
 *
 * Requer SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e
 * SUPABASE_SERVICE_ROLE_KEY no ambiente — inclusive em --dry-run, para
 * comparar a planilha com o estado atual do banco.
 */

const DEFAULT_FILE = "books-covers-amazon.csv";
const DEFAULT_COVERS_DIR = path.resolve(process.cwd(), "public/books/covers");

const TITLE_ALIASES = ["title", "titulo", "título", "book_title", "nome", "livro"];
const COVER_ALIASES = [
  "cover_filename",
  "cover_file",
  "cover",
  "capa",
  "nome_capa",
  "nome_da_capa",
  "arquivo_capa",
  "arquivo_da_capa",
  "cover_path",
];
const AMAZON_ALIASES = ["amazon_url", "amazon", "url_amazon", "link_amazon", "url"];

function stripAccents(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Chave de match: título sem acento, minúsculo, pontuação colapsada em
 * espaço único. Ex.: "Kafka à Beira-Mar" e "kafka a beira mar" caem na
 * mesma chave — mas "Kafka à Beira-Mar" e "Kafka no Mar" não.
 */
function normalizeTitle(text) {
  return stripAccents(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeHeaderCell(cell) {
  return stripAccents(cell).trim().toLowerCase();
}

/**
 * Monta "/books/covers/arquivo.jpg" a partir do nome de arquivo informado
 * na planilha, tolerando que já venha com prefixo "covers/" ou
 * "/books/covers/" (idempotente — não duplica o caminho).
 */
function buildCoverPath(filename) {
  const trimmed = filename.trim().replace(/^\/+/, "");
  const withoutKnownPrefix = trimmed
    .replace(/^books\/covers\//i, "")
    .replace(/^covers\//i, "");
  return `/books/covers/${withoutKnownPrefix}`;
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
    : path.resolve(process.cwd(), DEFAULT_FILE);

  const coversDirArg = argv.find((arg) => arg.startsWith("--covers-dir="));
  const coversDir = coversDirArg
    ? path.resolve(process.cwd(), coversDirArg.slice("--covers-dir=".length))
    : DEFAULT_COVERS_DIR;

  return { apply, file, coversDir };
}

// Mesma estratégia de fallback de encoding de `import-reading-history.js`
// (arquivos exportados por alguns apps de planilha no macOS não são UTF-8).
function readCsvText(filePath) {
  const buffer = fs.readFileSync(filePath);

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("macintosh").decode(buffer);
  }
}

function detectDelimiter(headerLine) {
  const semicolons = headerLine.split(";").length;
  const commas = headerLine.split(",").length;
  return semicolons >= commas ? ";" : ",";
}

/**
 * Parser mínimo (sem suporte a aspas/delimitador escapado — mesma
 * limitação documentada em `import-reading-history.js`). Resolve as
 * colunas por alias, então qualquer ordem/subconjunto das 3 colunas é
 * aceito, desde que "título" esteja presente.
 */
function parseCsv(text) {
  const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    throw new Error("Arquivo vazio.");
  }

  const delimiter = detectDelimiter(lines[0]);
  const header = lines[0].split(delimiter).map(normalizeHeaderCell);

  const titleIdx = header.findIndex((cell) => TITLE_ALIASES.includes(cell));
  const coverIdx = header.findIndex((cell) => COVER_ALIASES.includes(cell));
  const amazonIdx = header.findIndex((cell) => AMAZON_ALIASES.includes(cell));

  if (titleIdx === -1) {
    throw new Error(
      `Coluna de título não encontrada no cabeçalho. Aceitos: ${TITLE_ALIASES.join(", ")}.`
    );
  }
  if (coverIdx === -1 && amazonIdx === -1) {
    throw new Error(
      "Nenhuma coluna de capa nem de amazon_url encontrada no cabeçalho — nada a enriquecer."
    );
  }

  const rows = lines.slice(1).map((line, index) => {
    const cells = line.split(delimiter).map((cell) => cell.trim());
    return {
      __line: index + 2, // 1-based, +1 pela linha de header
      title: cells[titleIdx] ?? "",
      coverFilename: coverIdx !== -1 ? cells[coverIdx] ?? "" : "",
      amazonUrl: amazonIdx !== -1 ? cells[amazonIdx] ?? "" : "",
    };
  });

  return { rows, hasCoverColumn: coverIdx !== -1, hasAmazonColumn: amazonIdx !== -1 };
}

async function fetchExistingBooks(supabase) {
  const { data, error } = await supabase
    .from("books")
    .select("id, title, slug, cover_path, amazon_url");

  if (error) throw new Error(`books (select): ${error.message}`);
  return data ?? [];
}

function buildBooksByNormalizedTitle(books) {
  const map = new Map();
  for (const book of books) {
    const key = normalizeTitle(book.title);
    const bucket = map.get(key) ?? [];
    bucket.push(book);
    map.set(key, bucket);
  }
  return map;
}

/**
 * Plano puro (sem I/O) — mesma decisão em dry-run e apply. Cada linha da
 * planilha cai em exatamente uma destas categorias:
 *   - errors:     título vazio na planilha — linha ignorada.
 *   - notFound:   título não corresponde a nenhum livro cadastrado.
 *   - ambiguous:  título corresponde a mais de um livro (nome duplicado
 *                 no banco) — não é possível decidir qual atualizar.
 *   - noChange:   título encontrado, mas a linha não trouxe capa nem
 *                 amazon_url (nada a fazer).
 *   - updates:    título encontrado e ao menos um campo para atualizar.
 * `noCover` é um subconjunto informativo de updates/noChange — linhas
 * cujo título bateu mas que não trouxeram nome de capa.
 */
function buildPlan(rows, booksByNormalizedTitle, coversDir) {
  const errors = [];
  const notFound = [];
  const ambiguous = [];
  const noChange = [];
  const updates = [];
  const noCover = [];
  const missingCoverFile = [];

  const seenInFile = new Map(); // normalizedTitle -> linhas que usam esse título

  for (const row of rows) {
    const title = row.title.trim();

    if (!title) {
      errors.push({ line: row.__line, message: "título vazio — linha ignorada." });
      continue;
    }

    const key = normalizeTitle(title);
    seenInFile.set(key, [...(seenInFile.get(key) ?? []), row.__line]);

    const matches = booksByNormalizedTitle.get(key) ?? [];

    if (matches.length === 0) {
      notFound.push({ line: row.__line, title });
      continue;
    }

    if (matches.length > 1) {
      ambiguous.push({
        line: row.__line,
        title,
        matchedBookIds: matches.map((b) => b.id),
      });
      continue;
    }

    const book = matches[0];
    const coverFilename = row.coverFilename.trim();
    const amazonUrl = row.amazonUrl.trim();

    const fields = {};
    if (coverFilename) {
      fields.cover_path = buildCoverPath(coverFilename);

      const absoluteCoverPath = path.join(coversDir, path.basename(fields.cover_path));
      if (coversDir && fs.existsSync(coversDir) && !fs.existsSync(absoluteCoverPath)) {
        missingCoverFile.push({ line: row.__line, title, coverFilename, coversDir });
      }
    } else {
      noCover.push({ line: row.__line, title, bookId: book.id });
    }

    if (amazonUrl) {
      fields.amazon_url = amazonUrl;
    }

    if (Object.keys(fields).length === 0) {
      noChange.push({ line: row.__line, title, bookId: book.id });
      continue;
    }

    updates.push({
      line: row.__line,
      title,
      bookId: book.id,
      matchedTitle: book.title,
      fields,
      previous: { cover_path: book.cover_path ?? null, amazon_url: book.amazon_url ?? null },
    });
  }

  const duplicatesInFile = [...seenInFile.entries()]
    .filter(([, lines]) => lines.length > 1)
    .map(([key, lines]) => ({ key, lines }));

  return { errors, notFound, ambiguous, noChange, updates, noCover, missingCoverFile, duplicatesInFile };
}

function printUpdatesPreview(updates) {
  console.log(`\nLIVROS A ATUALIZAR (${updates.length})`);
  for (const item of updates) {
    const changes = Object.entries(item.fields)
      .map(([field, value]) => `${field}: "${item.previous[field] ?? "—"}" → "${value}"`)
      .join("; ");
    console.log(`  [linha ${item.line}] "${item.title}" (id=${item.bookId}) — ${changes}`);
  }
}

function printNotFound(notFound) {
  console.log(`\nLIVROS NÃO ENCONTRADOS (${notFound.length})`);
  for (const item of notFound) {
    console.log(`  [linha ${item.line}] "${item.title}" — nenhum livro cadastrado com este título.`);
  }
}

function printNoCover(noCover) {
  console.log(`\nLIVROS SEM CAPA CORRESPONDENTE NA PLANILHA (${noCover.length})`);
  for (const item of noCover) {
    console.log(`  [linha ${item.line}] "${item.title}" (id=${item.bookId}) — nenhum nome de arquivo de capa informado.`);
  }
}

function printMissingCoverFile(missingCoverFile) {
  if (missingCoverFile.length === 0) return;
  console.log(`\nAVISO — ARQUIVO DE CAPA NÃO ENCONTRADO EM DISCO (${missingCoverFile.length})`);
  for (const item of missingCoverFile) {
    console.log(
      `  [linha ${item.line}] "${item.title}" — "${item.coverFilename}" não existe em ${item.coversDir} ` +
        "(cover_path será gravado mesmo assim; envie o arquivo depois)."
    );
  }
}

function printAmbiguous(ambiguous) {
  if (ambiguous.length === 0) return;
  console.log(`\nAMBÍGUOS — TÍTULO BATE COM MAIS DE UM LIVRO, NÃO ALTERADOS (${ambiguous.length})`);
  for (const item of ambiguous) {
    console.log(`  [linha ${item.line}] "${item.title}" — ids: ${item.matchedBookIds.join(", ")}`);
  }
}

function printDuplicatesInFile(duplicatesInFile) {
  if (duplicatesInFile.length === 0) return;
  console.log(`\nAVISO — TÍTULO REPETIDO NA PLANILHA (${duplicatesInFile.length})`);
  for (const item of duplicatesInFile) {
    console.log(`  linhas ${item.lines.join(", ")} usam o mesmo título normalizado.`);
  }
}

function printNoChange(noChange) {
  if (noChange.length === 0) return;
  console.log(`\nLIVROS ENCONTRADOS SEM NENHUM CAMPO PARA ATUALIZAR (${noChange.length})`);
  for (const item of noChange) {
    console.log(`  [linha ${item.line}] "${item.title}" (id=${item.bookId}) — planilha sem capa nem amazon_url para esta linha.`);
  }
}

function printErrors(errors) {
  if (errors.length === 0) return;
  console.log(`\nERROS DE LINHA (${errors.length})`);
  for (const err of errors) {
    console.log(`  [linha ${err.line}] ${err.message}`);
  }
}

function printSummary(plan) {
  console.log("\nResumo");
  console.log(`  Livros a atualizar:            ${plan.updates.length}`);
  console.log(`  Livros não encontrados:        ${plan.notFound.length}`);
  console.log(`  Livros sem capa na planilha:   ${plan.noCover.length}`);
  console.log(`  Ambíguos (não alterados):      ${plan.ambiguous.length}`);
  console.log(`  Sem campo para atualizar:      ${plan.noChange.length}`);
  console.log(`  Títulos duplicados na planilha: ${plan.duplicatesInFile.length}`);
  console.log(`  Erros de linha:                ${plan.errors.length}`);
}

/**
 * Único ponto de escrita do script — sempre `.update().eq("id", ...)`
 * sobre um `id` já existente no banco (nunca `.insert()`).
 */
async function applyUpdate(supabase, item) {
  const { error } = await supabase.from("books").update(item.fields).eq("id", item.bookId);
  if (error) throw new Error(`books (update id=${item.bookId}): ${error.message}`);
}

async function main() {
  const { apply, file, coversDir } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(file)) {
    throw new Error(
      `Arquivo não encontrado: ${file}\nPasse o caminho explicitamente com --file=/caminho/planilha.csv`
    );
  }

  console.log(`Lendo planilha: ${file}`);
  console.log(`Diretório de capas (checagem informativa): ${coversDir}`);

  const text = readCsvText(file);
  const { rows, hasCoverColumn, hasAmazonColumn } = parseCsv(text);
  console.log(
    `${rows.length} linha(s) de dados encontradas. Colunas presentes: ` +
      `capa=${hasCoverColumn ? "sim" : "não"}, amazon_url=${hasAmazonColumn ? "sim" : "não"}.\n`
  );

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY são obrigatórias " +
        "(inclusive em --dry-run, para comparar a planilha com o estado atual do banco). " +
        "Rode com: node --env-file=.env.local scripts/backfill-books-covers-amazon.js"
    );
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  const existingBooks = await fetchExistingBooks(supabase);
  console.log(`${existingBooks.length} livro(s) cadastrado(s) no banco.\n`);

  const booksByNormalizedTitle = buildBooksByNormalizedTitle(existingBooks);
  const plan = buildPlan(rows, booksByNormalizedTitle, coversDir);

  console.log(apply ? "Plano (será executado):" : "Plano (dry-run — nada será gravado):");
  printUpdatesPreview(plan.updates);
  printNotFound(plan.notFound);
  printNoCover(plan.noCover);
  printMissingCoverFile(plan.missingCoverFile);
  printAmbiguous(plan.ambiguous);
  printNoChange(plan.noChange);
  printDuplicatesInFile(plan.duplicatesInFile);
  printErrors(plan.errors);
  printSummary(plan);

  if (!apply) {
    console.log(
      "\nDry run — nenhum dado foi gravado. Rode com --apply para gravar no Supabase " +
        "(idempotente — seguro rodar de novo; apenas UPDATE, nunca INSERT)."
    );
    return;
  }

  console.log("\nGravando no Supabase (apenas UPDATE, em lote sobre os livros encontrados)...\n");
  let succeeded = 0;
  const applyErrors = [];

  for (const item of plan.updates) {
    try {
      await applyUpdate(supabase, item);
      succeeded += 1;
      console.log(`  [linha ${item.line}] OK — "${item.title}" atualizado.`);
    } catch (error) {
      applyErrors.push({ line: item.line, title: item.title, message: error.message });
      console.error(`  [linha ${item.line}] ERRO — "${item.title}": ${error.message}`);
    }
  }

  console.log(`\nConcluído. Atualizados com sucesso: ${succeeded}. Falhas: ${applyErrors.length}.`);
  if (applyErrors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("\nFalha no backfill:", error.message);
  process.exitCode = 1;
});
