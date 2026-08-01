import type {
  ImportDetectionInput,
  ImportFileDescriptor,
  ImportFileFormat,
} from "@/lib/intelligence/imports/types";

const EXCEL_EXTENSIONS = new Set(["xls", "xlsx"]);

export function normalizeDetectionText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getFileExtension(fileName: string): string | undefined {
  const extension = fileName.split(".").pop()?.trim().toLowerCase();
  return extension && extension !== fileName.toLowerCase() ? extension : undefined;
}

export function inferFileFormat(file: ImportFileDescriptor): ImportFileFormat {
  if (file.format !== "unknown") return file.format;

  const extension = (file.extension ?? getFileExtension(file.name))?.toLowerCase();
  if (!extension) return "unknown";
  if (extension === "csv") return "csv";
  if (EXCEL_EXTENSIONS.has(extension)) return "excel";
  if (extension === "pdf") return "pdf";
  if (extension === "json") return "json";
  return "unknown";
}

export function getDetectionLines(input: ImportDetectionInput): string[] {
  if (input.firstLines?.length) {
    return [...input.firstLines];
  }

  if (!input.contentSample) {
    return [];
  }

  return input.contentSample
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export function getDetectionHeaders(input: ImportDetectionInput): string[] {
  if (input.headers?.length) {
    return input.headers.map((header) => header.trim()).filter(Boolean);
  }

  const [firstLine] = getDetectionLines(input);
  if (!firstLine) return [];

  const delimiter = firstLine.includes("\t")
    ? "\t"
    : firstLine.includes(";")
      ? ";"
      : ",";

  return firstLine
    .split(delimiter)
    .map((header) => header.replace(/^"|"$/g, "").trim())
    .filter(Boolean);
}

export function getDetectionHaystack(input: ImportDetectionInput): string {
  const parts = [
    input.file.name,
    input.file.extension,
    input.file.mimeType,
    inferFileFormat(input.file),
    ...getDetectionHeaders(input),
    ...getDetectionLines(input),
    input.contentSample,
  ].filter((part): part is string => Boolean(part));

  return normalizeDetectionText(parts.join(" "));
}

export function countMatches(haystack: string, needles: readonly string[]): number {
  return needles.filter((needle) => haystack.includes(normalizeDetectionText(needle))).length;
}
