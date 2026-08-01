import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { previewImportFile } from "@/lib/intelligence/imports/preview";
import type { ImportFileDescriptor } from "@/lib/intelligence/imports/types";

function fixtureUrl(relativePath: string): URL {
  return new URL(`./test-data/${relativePath}`, import.meta.url);
}

function readFixture(relativePath: string): string {
  return readFileSync(fixtureUrl(relativePath), "utf8");
}

function descriptor(relativePath: string): ImportFileDescriptor {
  const fileUrl = fixtureUrl(relativePath);
  const name = relativePath.split("/").pop() ?? relativePath;

  return {
    id: name,
    name,
    size: statSync(fileUrl).size,
    extension: name.split(".").pop(),
    format: "unknown",
    mimeType: "text/csv",
  };
}

describe("previewImportFile", () => {
  it("gera uma preview pronta para revisão a partir de um CSV do YouTube Studio", async () => {
    const relativePath = "youtube/youtube-studio-report.csv";

    const result = await previewImportFile({
      file: descriptor(relativePath),
      content: readFixture(relativePath),
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("esperado status 'ready'");
    expect(result.platform).toBe("youtube");
    expect(result.preview.videoCount).toBe(2);
    expect(result.preview.issues).toEqual([]);
  });

  it("marca como não suportado quando a plataforma detectada ainda não tem adapter conectado", async () => {
    const relativePath = "instagram/instagram-reels-insights.csv";

    const result = await previewImportFile({
      file: descriptor(relativePath),
      content: readFixture(relativePath),
    });

    expect(result).toMatchObject({ status: "unsupported", platform: "instagram" });
  });

  it("marca como não suportado quando não reconhece a plataforma do arquivo", async () => {
    const relativePath = "generic/generic-report.csv";

    const result = await previewImportFile({
      file: descriptor(relativePath),
      content: readFixture(relativePath),
    });

    expect(result).toMatchObject({ status: "unsupported", platform: "unknown" });
  });
});
