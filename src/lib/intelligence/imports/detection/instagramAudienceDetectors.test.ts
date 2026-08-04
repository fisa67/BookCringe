import { describe, expect, it } from "vitest";
import { IntelligenceFileDetector } from "@/lib/intelligence/imports/detection/fileDetector";
import {
  instagramAudienceActivityDetector,
  instagramAudienceDemographicsDetector,
  instagramAudienceHistoryDetector,
  instagramAudienceTerritoryDetector,
  instagramDetector,
} from "@/lib/intelligence/imports/detection/platformDetectors";
import type { ImportFileDescriptor } from "@/lib/intelligence/imports/types";

/**
 * Os 4 detectores de audiência do Instagram compartilham `platform:
 * "instagram"` com o `instagramDetector` legado (Reels) — o
 * `IntelligenceFileDetector` não tem restrição de unicidade de plataforma
 * entre detectores (`detection/types.ts`), então o objetivo destes testes é
 * garantir que, para cada um dos 4 formatos reais, o detector CERTO ganha
 * (maior confiança), mesmo com os outros 4 concorrendo pelo mesmo arquivo.
 */

const detector = new IntelligenceFileDetector();

function fileDescriptor(name: string, extension = "xlsx"): ImportFileDescriptor {
  return { id: name, name, size: 100, extension, format: extension === "csv" ? "csv" : "excel" };
}

describe("detectores de audiência do Instagram — sem colisão entre os 4 formatos", () => {
  it("FollowerHistory ganha com maior confiança entre os 4 detectores de audiência", () => {
    const headers = ["Date", "Followers", "Difference in followers from previous day"];

    expect(instagramAudienceHistoryDetector.score({ file: fileDescriptor("FollowerHistory.xlsx"), headers }).confidence).toBeGreaterThan(
      instagramAudienceActivityDetector.score({ file: fileDescriptor("FollowerHistory.xlsx"), headers }).confidence
    );
    expect(instagramAudienceHistoryDetector.score({ file: fileDescriptor("FollowerHistory.xlsx"), headers }).confidence).toBeGreaterThan(
      instagramAudienceDemographicsDetector.score({ file: fileDescriptor("FollowerHistory.xlsx"), headers }).confidence
    );
    expect(instagramAudienceHistoryDetector.score({ file: fileDescriptor("FollowerHistory.xlsx"), headers }).confidence).toBeGreaterThan(
      instagramAudienceTerritoryDetector.score({ file: fileDescriptor("FollowerHistory.xlsx"), headers }).confidence
    );
  });

  it("cada um dos 4 exports reais é resolvido pelo IntelligenceFileDetector como instagram, com o formato certo detectado por cabeçalhos", async () => {
    const cases: Array<{ name: string; headers: string[] }> = [
      { name: "FollowerHistory.xlsx", headers: ["Date", "Followers", "Difference in followers from previous day"] },
      { name: "FollowerActivity.xlsx", headers: ["Date", "Hour", "Active followers"] },
      { name: "FollowerGender.xlsx", headers: ["Gender", "Distribution"] },
      { name: "FollowerTopTerritories.xlsx", headers: ["Top territories", "Distribution"] },
    ];

    for (const testCase of cases) {
      const result = await detector.detect({ file: fileDescriptor(testCase.name), headers: testCase.headers });
      expect(result.platform).toBe("instagram");
      expect(result.format).toBe("excel");
      expect(result.confidence).toBeGreaterThanOrEqual(0.3);
    }
  });

  it("FollowerGender e FollowerTopTerritories (mesma coluna Distribution) não se confundem entre si", () => {
    const genderHeaders = ["Gender", "Distribution"];
    const territoryHeaders = ["Top territories", "Distribution"];

    const genderScoreForGenderFile = instagramAudienceDemographicsDetector.score({
      file: fileDescriptor("FollowerGender.xlsx"),
      headers: genderHeaders,
    });
    const territoryScoreForGenderFile = instagramAudienceTerritoryDetector.score({
      file: fileDescriptor("FollowerGender.xlsx"),
      headers: genderHeaders,
    });
    expect(genderScoreForGenderFile.confidence).toBeGreaterThan(territoryScoreForGenderFile.confidence);

    const territoryScoreForTerritoryFile = instagramAudienceTerritoryDetector.score({
      file: fileDescriptor("FollowerTopTerritories.xlsx"),
      headers: territoryHeaders,
    });
    const genderScoreForTerritoryFile = instagramAudienceDemographicsDetector.score({
      file: fileDescriptor("FollowerTopTerritories.xlsx"),
      headers: territoryHeaders,
    });
    expect(territoryScoreForTerritoryFile.confidence).toBeGreaterThan(genderScoreForTerritoryFile.confidence);
  });

  it("o Reels legado (instagramDetector) continua funcionando e não domina os formatos de audiência", () => {
    const reelsHeaders = ["Reel", "Reach", "Accounts reached", "Likes", "Saves", "Shares"];

    const reelsScore = instagramDetector.score({ file: fileDescriptor("reels.csv", "csv"), headers: reelsHeaders });
    const historyScoreForReelsFile = instagramAudienceHistoryDetector.score({
      file: fileDescriptor("reels.csv", "csv"),
      headers: reelsHeaders,
    });

    expect(reelsScore.confidence).toBeGreaterThan(historyScoreForReelsFile.confidence);
  });
});
