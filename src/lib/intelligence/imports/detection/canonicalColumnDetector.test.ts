import { describe, expect, it } from "vitest";
import { createCanonicalColumnDetector } from "@/lib/intelligence/imports/detection/canonicalColumnDetector";
import type { CanonicalColumnSchema } from "@/lib/intelligence/imports/columns";
import { YOUTUBE_COLUMN_SCHEMA } from "@/lib/intelligence/imports/platforms/youtube/columns";
import type { ImportDetectionInput } from "@/lib/intelligence/imports/types";

type DemoColumn = "title" | "views";

const DEMO_SCHEMA: CanonicalColumnSchema<DemoColumn> = {
  aliases: {
    title: ["Title", "Título"],
    views: ["Views", "Visualizações"],
  },
  required: ["title"],
  optional: ["views"],
};

function input(overrides: Partial<ImportDetectionInput> & { headers?: string[]; name?: string }): ImportDetectionInput {
  return {
    file: {
      id: "demo",
      name: overrides.name ?? "report.csv",
      size: 100,
      extension: "csv",
      format: "csv",
      mimeType: "text/csv",
    },
    headers: overrides.headers,
    contentSample: overrides.contentSample,
  };
}

describe("createCanonicalColumnDetector", () => {
  const detector = createCanonicalColumnDetector({
    platform: "youtube",
    schema: DEMO_SCHEMA,
    brandHints: ["youtube", "studio"],
  });

  it("dá confiança alta quando todas as colunas obrigatórias e opcionais estão presentes, mesmo sem marca no nome", () => {
    const score = detector.score(input({ headers: ["Título", "Visualizações"], name: "Table data.csv" }));

    expect(score.platform).toBe("youtube");
    expect(score.confidence).toBeGreaterThanOrEqual(0.8);
    expect(score.reasons.some((reason) => reason.includes("obrigatórias"))).toBe(true);
  });

  it("usa aliases — inglês e português resolvem para as mesmas colunas canônicas", () => {
    const english = detector.score(input({ headers: ["Title", "Views"] }));
    const portuguese = detector.score(input({ headers: ["Título", "Visualizações"] }));

    expect(english.confidence).toBe(portuguese.confidence);
  });

  it("confia mais nas colunas do que no nome do arquivo", () => {
    const withColumnsNoBrand = detector.score(input({ headers: ["Title", "Views"], name: "export.csv" }));
    const withBrandNoColumns = detector.score(input({ headers: ["Foo", "Bar"], name: "youtube-studio.csv" }));

    expect(withColumnsNoBrand.confidence).toBeGreaterThan(withBrandNoColumns.confidence);
  });

  it("baixa a confiança quando falta coluna obrigatória", () => {
    const score = detector.score(input({ headers: ["Views"] }));
    expect(score.confidence).toBeLessThan(0.3);
  });
});

describe("createCanonicalColumnDetector + YOUTUBE_COLUMN_SCHEMA", () => {
  const youtubeDetector = createCanonicalColumnDetector({
    platform: "youtube",
    schema: YOUTUBE_COLUMN_SCHEMA,
    brandHints: ["youtube", "studio", "channel"],
  });

  it("reconhece o Table data.csv em português só pelos cabeçalhos (sem 'youtube' no nome)", () => {
    const score = youtubeDetector.score(
      input({
        name: "Table data.csv",
        headers: [
          "Conteúdo",
          "Título do vídeo",
          "Horário de publicação do vídeo",
          "Duração",
          "Visualizações",
          "Tempo de exibição (horas)",
          "Inscritos",
          "Impressões",
          "Taxa de cliques de impressões (%)",
        ],
      })
    );

    expect(score.platform).toBe("youtube");
    expect(score.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("não confunde cabeçalhos do TikTok com YouTube (igualdade exata, não substring)", () => {
    const score = youtubeDetector.score(
      input({
        name: "tiktok-creator-analytics.csv",
        headers: ["Video title", "Video views", "Total play time", "Average watch time"],
      })
    );

    // Só `videoTitle` casa; as métricas do TikTok não são aliases do YouTube.
    expect(score.confidence).toBeLessThan(0.5);
  });
});
