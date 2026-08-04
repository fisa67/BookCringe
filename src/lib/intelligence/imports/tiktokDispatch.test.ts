import { describe, expect, it } from "vitest";
import { dispatchTikTokImport } from "@/lib/intelligence/imports/tiktokDispatch";

describe("dispatchTikTokImport", () => {
  it("despacha somente tiktok_promotions para o adapter implementado", () => {
    expect(
      dispatchTikTokImport({
        platform: "tiktok",
        datasetKind: "tiktok_promotions",
      })
    ).toBe("tiktok_promotions");
  });

  it("mantém tiktok_creator explicitamente unsupported", () => {
    expect(
      dispatchTikTokImport({
        platform: "tiktok",
        datasetKind: "tiktok_creator",
      })
    ).toBe("unsupported");
  });

  it("não interfere no dispatch de outras plataformas", () => {
    expect(dispatchTikTokImport({ platform: "youtube" })).toBeNull();
  });
});
