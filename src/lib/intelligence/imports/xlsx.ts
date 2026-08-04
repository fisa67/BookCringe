import ExcelJS from "exceljs";

/**
 * Leitor de baixo nível de `.xlsx` — mesma camada que o split de CSV já
 * feito (hoje duplicado) dentro de cada `platforms/<plataforma>/parser.ts`:
 * só entende a ESTRUTURA do arquivo (planilha → linhas de células), nunca o
 * SIGNIFICADO das colunas. Não é um "parser genérico de plataforma" (isso
 * continua proibido por `docs/intelligence/IMPORTS.md`) — é o equivalente,
 * para `.xlsx`, de "quebrar uma linha de CSV em campos por vírgula".
 *
 * Usa `exceljs` (não `xlsx`/SheetJS: o pacote publicado no npm tem duas
 * vulnerabilidades altas sem correção disponível — `npm audit` — enquanto
 * `exceljs` só carrega uma dependência transitiva moderada e corrigível).
 *
 * Cada célula é convertida para `string` (via `String(...).trim()`),
 * inclusive números — mesma representação que o parser do YouTube já espera
 * de uma linha de CSV (`parseNumber` em `platforms/youtube/parser.ts`
 * também recebe strings) — assim o parser de cada plataforma pode tratar
 * linhas vindas de CSV ou de `.xlsx` exatamente da mesma forma.
 */

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    if (value instanceof Date) return value.toISOString();
    if ("result" in value) return cellToString(value.result as ExcelJS.CellValue);
    if ("text" in value) return String((value as { text: unknown }).text).trim();
    if ("richText" in value) {
      return (value as { richText: { text: string }[] }).richText.map((part) => part.text).join("").trim();
    }
    return String(value).trim();
  }

  return String(value).trim();
}

/**
 * Lê a primeira planilha de um `.xlsx` (todos os exports do Instagram usam
 * uma única planilha) e devolve suas linhas como `string[][]` — a primeira
 * linha é sempre o cabeçalho, igual ao que `parseCsv` produz para um CSV.
 * Linhas totalmente vazias são ignoradas (mesma tolerância que o parser do
 * YouTube já tem para o CSV).
 */
export async function parseXlsxToRows(buffer: ArrayBuffer | Buffer): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  // `exceljs/index.d.ts` declara `interface Buffer extends ArrayBuffer {}`
  // no escopo global (bug conhecido do pacote) — isso "contamina" o tipo
  // `Buffer` do Node só para quem importa `exceljs`, exigindo propriedades
  // de `ArrayBuffer` que um Buffer real não tem. `as any` aqui contorna
  // exclusivamente esse desalinhamento de tipos; em runtime segue sendo um
  // Buffer/ArrayBuffer normal, sem relação com o restante do arquivo.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows: string[][] = [];

  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values = row.values as ExcelJS.CellValue[];
    // `row.values` é 1-indexado (índice 0 fica vazio) — descartado aqui.
    const cells = values.slice(1).map(cellToString);
    if (cells.some((cell) => cell.length > 0)) {
      rows.push(cells);
    }
  });

  return rows;
}
