import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  normalizeYouTubeStudioCsv,
  youtubeStudioNormalizer,
  youtubeStudioParser,
} from "@/lib/intelligence/imports/platforms/youtube/parser";
import type {
  ImportBatch,
  ImportFileDescriptor,
  ParserInput,
} from "@/lib/intelligence/imports/types";

const fixtureUrl = new URL("../../test-data/youtube/youtube-studio-report.csv", import.meta.url);
const fixtureName = "youtube-studio-report.csv";

function fixtureUrlFor(name: string): URL {
  return new URL(`../../test-data/youtube/${name}`, import.meta.url);
}

function readFixture(url: URL): string {
  return readFileSync(url, "utf8");
}

function readYouTubeFixture(): string {
  return readFixture(fixtureUrl);
}

function fileDescriptor(name: string = fixtureName, url: URL = fixtureUrl): ImportFileDescriptor {
  return {
    id: "youtube-fixture",
    name,
    size: statSync(url).size,
    mimeType: "text/csv",
    extension: "csv",
    format: "csv",
  };
}

function batch(): ImportBatch {
  return {
    id: "batch-youtube",
    platform: "youtube",
    status: "detected",
    files: [fileDescriptor()],
    createdAt: "2026-08-01T12:00:00.000Z",
  };
}

function parserInput(): ParserInput {
  return {
    batchId: "batch-youtube",
    platform: "youtube",
    file: fileDescriptor(),
    payload: readYouTubeFixture(),
  };
}

describe("youtubeStudioImporter", () => {
  it("parseia o youtube-studio-report.csv sem persistir dados", async () => {
    const result = await youtubeStudioParser.parse(parserInput());

    expect(result.issues).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toEqual({
      platform: "youtube",
      fileId: "youtube-fixture",
      row: 2,
      sourceRecord: {
        videoTitle: "Como ler mais em 2026",
        videoPublishTime: "2026-01-02",
        views: 15420,
        watchTimeHours: 892.5,
        impressions: 91000,
        subscribers: 318,
      },
    });
  });

  it("normaliza registros do YouTube Studio para NormalizedImportRecord", async () => {
    const parseResult = await youtubeStudioParser.parse(parserInput());
    const result = await youtubeStudioNormalizer.normalize(parseResult.records, batch());

    expect(result.issues).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toEqual({
      platform: "youtube",
      entityType: "platform_metric",
      payload: {
        source: "youtube_studio",
        title: "Como ler mais em 2026",
        publishedAt: "2026-01-02",
        metrics: {
          views: 15420,
          watchTimeHours: 892.5,
          impressions: 91000,
          subscribers: 318,
        },
      },
      source: {
        batchId: "batch-youtube",
        fileId: "youtube-fixture",
        row: 2,
      },
    });
  });

  it("executa o adapter completo até o modelo normalizado", async () => {
    const result = await normalizeYouTubeStudioCsv({
      batch: batch(),
      input: parserInput(),
    });

    expect(result.issues).toEqual([]);
    expect(result.records).toEqual([
      {
        platform: "youtube",
        entityType: "platform_metric",
        payload: {
          source: "youtube_studio",
          title: "Como ler mais em 2026",
          publishedAt: "2026-01-02",
          metrics: {
            views: 15420,
            watchTimeHours: 892.5,
            impressions: 91000,
            subscribers: 318,
          },
        },
        source: {
          batchId: "batch-youtube",
          fileId: "youtube-fixture",
          row: 2,
        },
      },
      {
        platform: "youtube",
        entityType: "platform_metric",
        payload: {
          source: "youtube_studio",
          title: "Livros que mudaram minha rotina",
          publishedAt: "2026-01-09",
          metrics: {
            views: 22100,
            watchTimeHours: 1104.2,
            impressions: 120400,
            subscribers: 502,
          },
        },
        source: {
          batchId: "batch-youtube",
          fileId: "youtube-fixture",
          row: 3,
        },
      },
    ]);
  });
});

describe("youtubeStudioImporter — conta em português (i18n)", () => {
  it("parseia um relatório com cabeçalhos em português (mesmas colunas, nomes localizados)", async () => {
    const url = fixtureUrlFor("youtube-studio-report-pt.csv");
    const result = await youtubeStudioParser.parse({
      batchId: "batch-youtube",
      platform: "youtube",
      file: fileDescriptor("youtube-studio-report-pt.csv", url),
      payload: readFixture(url),
    });

    expect(result.issues).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toEqual({
      platform: "youtube",
      fileId: "youtube-fixture",
      row: 2,
      sourceRecord: {
        videoTitle: "Como ler mais em 2026",
        videoPublishTime: "2026-01-02",
        views: 15420,
        watchTimeHours: 892.5,
        impressions: 91000,
        subscribers: 318,
      },
    });
  });

  it("parseia o export real do YouTube Studio (3 arquivos, aqui só o 'Table data.csv'): ignora silenciosamente a linha agregada 'Total' e colunas extras (Conteúdo/Duração)", async () => {
    const url = fixtureUrlFor("youtube-studio-table-data-pt.csv");
    const result = await youtubeStudioParser.parse({
      batchId: "batch-youtube",
      platform: "youtube",
      file: fileDescriptor("Table data.csv", url),
      payload: readFixture(url),
    });

    // A linha "Total" não tem título nem horário de publicação — é
    // reconhecida como agregado (não representa um vídeo) e descartada
    // sem gerar nenhum issue, exatamente como pedido.
    expect(result.issues).toEqual([]);
    expect(result.records).toHaveLength(2);
    expect(result.records.map((record) => record.sourceRecord.videoTitle)).toEqual([
      "Agente Secreto não é um filme confortável",
      "A Odisseia: o livro que inspirou o novo filme de Christopher Nolan.",
    ]);
  });

  it("retorna youtube-missing-headers para um idioma ainda não cadastrado", async () => {
    const result = await youtubeStudioParser.parse({
      batchId: "batch-youtube",
      platform: "youtube",
      file: fileDescriptor(),
      payload: "Titre de la vidéo,Vues\n\"Vidéo\",100\n",
    });

    expect(result.records).toEqual([]);
    expect(result.issues).toEqual([
      {
        stage: "parse",
        code: "youtube-missing-headers",
        message: "O relatório do YouTube Studio não possui as colunas obrigatórias: videoTitle, videoPublishTime.",
      },
    ]);
  });

  it("retorna youtube-missing-headers listando qual coluna obrigatória falta, mesmo com o resto do arquivo válido", async () => {
    const result = await youtubeStudioParser.parse({
      batchId: "batch-youtube",
      platform: "youtube",
      file: fileDescriptor(),
      payload: 'Video title,Views\n"Meu vídeo",100\n',
    });

    expect(result.records).toEqual([]);
    expect(result.issues).toEqual([
      {
        stage: "parse",
        code: "youtube-missing-headers",
        message: "O relatório do YouTube Studio não possui as colunas obrigatórias: videoPublishTime.",
      },
    ]);
  });

  it("continua importando quando uma coluna opcional (métrica) some do export — a métrica ausente entra como 0", async () => {
    const result = await youtubeStudioParser.parse({
      batchId: "batch-youtube",
      platform: "youtube",
      file: fileDescriptor(),
      payload:
        'Video title,Video publish time,Views,Watch time (hours),Impressions\n' +
        '"Meu vídeo",2026-01-02,15420,892.5,91000\n',
    });

    expect(result.issues).toEqual([]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.sourceRecord).toEqual({
      videoTitle: "Meu vídeo",
      videoPublishTime: "2026-01-02",
      views: 15420,
      watchTimeHours: 892.5,
      impressions: 91000,
      subscribers: 0,
    });
  });

  it("resolve uma linha de cabeçalho com colunas em 3 idiomas diferentes ao mesmo tempo (aliases funcionando por coluna, não por arquivo)", async () => {
    const result = await youtubeStudioParser.parse({
      batchId: "batch-youtube",
      platform: "youtube",
      file: fileDescriptor(),
      payload:
        // título em inglês, data em português, views em espanhol, watch time em português, impressões em inglês, inscritos em português
        "Video title,Horário de publicação do vídeo,Vistas,Tempo de exibição (horas),Impressions,Inscritos\n" +
        '"Como ler mais em 2026",2026-01-02,15420,892.5,91000,318\n',
    });

    expect(result.issues).toEqual([]);
    expect(result.records).toEqual([
      {
        platform: "youtube",
        fileId: "youtube-fixture",
        row: 2,
        sourceRecord: {
          videoTitle: "Como ler mais em 2026",
          videoPublishTime: "2026-01-02",
          views: 15420,
          watchTimeHours: 892.5,
          impressions: 91000,
          subscribers: 318,
        },
      },
    ]);
  });

  it("resolve os cabeçalhos mesmo em ordem diferente da canônica", async () => {
    const result = await youtubeStudioParser.parse({
      batchId: "batch-youtube",
      platform: "youtube",
      file: fileDescriptor(),
      payload:
        "Subscribers,Impressions,Watch time (hours),Views,Video publish time,Video title\n" +
        '318,91000,892.5,15420,2026-01-02,"Como ler mais em 2026"\n',
    });

    expect(result.issues).toEqual([]);
    expect(result.records[0]?.sourceRecord).toEqual({
      videoTitle: "Como ler mais em 2026",
      videoPublishTime: "2026-01-02",
      views: 15420,
      watchTimeHours: 892.5,
      impressions: 91000,
      subscribers: 318,
    });
  });
});
