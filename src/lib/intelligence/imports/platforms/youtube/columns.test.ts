import { describe, expect, it } from "vitest";
import { matchColumns } from "@/lib/intelligence/imports/columns";
import { YOUTUBE_COLUMN_SCHEMA } from "./columns";

const ENGLISH_HEADERS = ["Video title", "Video publish time", "Views", "Watch time (hours)", "Impressions", "Subscribers"];

const PORTUGUESE_HEADERS = [
  "Título do vídeo",
  "Horário de publicação do vídeo",
  "Visualizações",
  "Tempo de exibição (horas)",
  "Impressões",
  "Inscritos",
];

const SPANISH_HEADERS = [
  "Título del video",
  "Hora de publicación del video",
  "Vistas",
  "Tiempo de visualización (horas)",
  "Impresiones",
  "Suscriptores",
];

describe("YOUTUBE_COLUMN_SCHEMA + matchColumns", () => {
  it("resolve cabeçalhos em inglês", () => {
    const match = matchColumns(YOUTUBE_COLUMN_SCHEMA, ENGLISH_HEADERS);

    expect(match.missingRequired).toEqual([]);
    expect(match.missingOptional).toEqual([]);
    expect(Object.fromEntries(match.indexes)).toEqual({
      videoTitle: 0,
      videoPublishTime: 1,
      views: 2,
      watchTimeHours: 3,
      impressions: 4,
      subscribers: 5,
    });
  });

  it("resolve cabeçalhos em português, tratando 'Título do vídeo' e 'Video title' como a mesma coluna canônica", () => {
    const match = matchColumns(YOUTUBE_COLUMN_SCHEMA, PORTUGUESE_HEADERS);

    expect(match.missingRequired).toEqual([]);
    expect(Object.fromEntries(match.indexes)).toEqual({
      videoTitle: 0,
      videoPublishTime: 1,
      views: 2,
      watchTimeHours: 3,
      impressions: 4,
      subscribers: 5,
    });
  });

  it("resolve cabeçalhos em espanhol", () => {
    const match = matchColumns(YOUTUBE_COLUMN_SCHEMA, SPANISH_HEADERS);

    expect(match.missingRequired).toEqual([]);
    expect(match.missingOptional).toEqual([]);
  });

  it("ignora acentuação, caixa e espaços ao comparar", () => {
    const match = matchColumns(YOUTUBE_COLUMN_SCHEMA, [
      "  TÍTULO DO VÍDEO  ",
      "horario de publicacao do video",
      "visualizações",
      "TEMPO DE EXIBIÇÃO (Horas)",
      "impressões",
      "inscritos",
    ]);

    expect(match.missingRequired).toEqual([]);
  });

  it("resolve cabeçalhos mesmo com colunas extras não canônicas, em qualquer posição (ex.: Table data.csv real)", () => {
    const match = matchColumns(YOUTUBE_COLUMN_SCHEMA, [
      "Conteúdo",
      "Título do vídeo",
      "Horário de publicação do vídeo",
      "Duração",
      "Visualizações",
      "Tempo de exibição (horas)",
      "Inscritos",
      "Impressões",
      "Taxa de cliques de impressões (%)",
    ]);

    expect(match.missingRequired).toEqual([]);
    expect(Object.fromEntries(match.indexes)).toEqual({
      videoTitle: 1,
      videoPublishTime: 2,
      views: 4,
      watchTimeHours: 5,
      impressions: 7,
      subscribers: 6,
    });
  });

  it("resolve cabeçalhos com colunas em ordem diferente da canônica", () => {
    const match = matchColumns(YOUTUBE_COLUMN_SCHEMA, [...ENGLISH_HEADERS].reverse());

    expect(match.missingRequired).toEqual([]);
    expect(Object.fromEntries(match.indexes)).toEqual({
      subscribers: 0,
      impressions: 1,
      watchTimeHours: 2,
      views: 3,
      videoPublishTime: 4,
      videoTitle: 5,
    });
  });

  it("resolve uma mistura de idiomas na mesma linha de cabeçalho", () => {
    const match = matchColumns(YOUTUBE_COLUMN_SCHEMA, [
      "Video title", // inglês
      "Horário de publicação do vídeo", // português
      "Vistas", // espanhol
      "Tempo de exibição (horas)", // português
      "Impressions", // inglês
      "Inscritos", // português
    ]);

    expect(match.missingRequired).toEqual([]);
    expect(match.missingOptional).toEqual([]);
  });

  it("reporta qual coluna obrigatória falta, sem invalidar as demais", () => {
    const match = matchColumns(YOUTUBE_COLUMN_SCHEMA, ["Título do vídeo", "Visualizações"]);

    expect(match.missingRequired).toEqual(["videoPublishTime"]);
    expect(match.matchedRequired).toEqual(["videoTitle"]);
    expect(match.matchedOptional).toEqual(["views"]);
  });

  it("reporta colunas opcionais (métricas) ausentes, sem afetar a resolução das obrigatórias", () => {
    const match = matchColumns(YOUTUBE_COLUMN_SCHEMA, ["Video title", "Video publish time"]);

    expect(match.missingRequired).toEqual([]);
    expect(match.missingOptional).toEqual(["views", "watchTimeHours", "impressions", "subscribers"]);
  });

  it("não resolve nenhuma coluna para cabeçalhos de um idioma não cadastrado", () => {
    const match = matchColumns(YOUTUBE_COLUMN_SCHEMA, ["Titre de la vidéo", "Vues"]);

    expect(match.missingRequired).toEqual(["videoTitle", "videoPublishTime"]);
  });

  it("não confunde palavra genérica de outra plataforma com coluna canônica (ex.: 'Video views' do TikTok não é 'Views')", () => {
    const match = matchColumns(YOUTUBE_COLUMN_SCHEMA, [
      "Video title",
      "Video views",
      "Total play time",
      "Average watch time",
    ]);

    expect(match.matchedRequired).toEqual(["videoTitle"]);
    expect(match.matchedOptional).toEqual([]);
  });
});
