import { describe, expect, it } from "vitest";
import { resolveThumbnailPath } from "@/lib/content";

describe("resolveThumbnailPath", () => {
  it("retorna undefined para valores nulos, vazios ou só com espaços", () => {
    expect(resolveThumbnailPath(null)).toBeUndefined();
    expect(resolveThumbnailPath(undefined)).toBeUndefined();
    expect(resolveThumbnailPath("")).toBeUndefined();
    expect(resolveThumbnailPath("   ")).toBeUndefined();
  });

  it("aceita paths relativos do /public", () => {
    expect(resolveThumbnailPath("/thumbnails/reel-1.jpg")).toBe("/thumbnails/reel-1.jpg");
  });

  it("normaliza URLs protocol-relative para https", () => {
    expect(resolveThumbnailPath("//cdn.example.com/thumb.jpg")).toBe("https://cdn.example.com/thumb.jpg");
  });

  it("aceita URLs http/https absolutas", () => {
    expect(resolveThumbnailPath("https://instagram.com/p/abc/media")).toBe("https://instagram.com/p/abc/media");
  });

  it("rejeita strings inválidas que quebrariam o <img> sem fallback", () => {
    expect(resolveThumbnailPath("not-a-url")).toBeUndefined();
    expect(resolveThumbnailPath("javascript:alert(1)")).toBeUndefined();
  });
});
