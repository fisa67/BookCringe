import { describe, expect, it } from "vitest";
import { getColumnValue, matchColumns, type CanonicalColumnSchema } from "./columns";

type TestColumn = "title" | "date" | "views";

const SCHEMA: CanonicalColumnSchema<TestColumn> = {
  aliases: {
    title: ["Title", "Título"],
    date: ["Date", "Data"],
    views: ["Views", "Visualizações"],
  },
  required: ["title", "date"],
  optional: ["views"],
};

describe("matchColumns", () => {
  it("resolve todas as colunas quando todos os aliases (em qualquer idioma) estão presentes", () => {
    const match = matchColumns(SCHEMA, ["Title", "Date", "Views"]);

    expect(match.matchedRequired).toEqual(["title", "date"]);
    expect(match.missingRequired).toEqual([]);
    expect(match.matchedOptional).toEqual(["views"]);
    expect(match.missingOptional).toEqual([]);
    expect(Object.fromEntries(match.indexes)).toEqual({ title: 0, date: 1, views: 2 });
  });

  it("resolve por igualdade normalizada — ignora acento, caixa e espaços", () => {
    const match = matchColumns(SCHEMA, ["  TÍTULO  ", "data", "VISUALIZAÇÕES"]);

    expect(match.missingRequired).toEqual([]);
    expect(match.matchedOptional).toEqual(["views"]);
  });

  it("funciona com colunas em qualquer ordem", () => {
    const match = matchColumns(SCHEMA, ["Views", "Date", "Title"]);

    expect(Object.fromEntries(match.indexes)).toEqual({ views: 0, date: 1, title: 2 });
  });

  it("ignora colunas extras/desconhecidas, em qualquer posição", () => {
    const match = matchColumns(SCHEMA, ["Extra 1", "Title", "Extra 2", "Date", "Extra 3"]);

    expect(match.missingRequired).toEqual([]);
    expect(Object.fromEntries(match.indexes)).toEqual({ title: 1, date: 3 });
  });

  it("reporta coluna obrigatória ausente sem invalidar as demais", () => {
    const match = matchColumns(SCHEMA, ["Title", "Views"]);

    expect(match.matchedRequired).toEqual(["title"]);
    expect(match.missingRequired).toEqual(["date"]);
    expect(match.matchedOptional).toEqual(["views"]);
  });

  it("reporta coluna opcional ausente sem afetar as obrigatórias", () => {
    const match = matchColumns(SCHEMA, ["Title", "Date"]);

    expect(match.missingRequired).toEqual([]);
    expect(match.matchedOptional).toEqual([]);
    expect(match.missingOptional).toEqual(["views"]);
  });

  it("resolve uma mistura de idiomas na mesma linha de cabeçalho", () => {
    const match = matchColumns(SCHEMA, ["Título", "Date", "Visualizações"]);

    expect(match.missingRequired).toEqual([]);
    expect(match.matchedOptional).toEqual(["views"]);
  });
});

describe("getColumnValue", () => {
  it("retorna o valor (sem espaços) da coluna encontrada", () => {
    const match = matchColumns(SCHEMA, ["Title", "Date"]);
    expect(getColumnValue(["  Meu vídeo  ", "2026-01-01"], match, "title")).toBe("Meu vídeo");
  });

  it("retorna undefined para uma coluna que não foi encontrada nos cabeçalhos", () => {
    const match = matchColumns(SCHEMA, ["Title", "Date"]);
    expect(getColumnValue(["Meu vídeo", "2026-01-01"], match, "views")).toBeUndefined();
  });
});
