// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import { ContentThumbnail } from "@/components/content/ContentThumbnail";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("ContentThumbnail", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it("mostra fallback com emoji quando thumbnail_path é inválido", async () => {
    await act(async () => {
      root.render(<ContentThumbnail thumbnailPath="   " title="Reel teste" contentType="reel" />);
    });

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("🎥");
  });

  it("cai no fallback quando a imagem falha ao carregar (URL expirada ou bloqueada)", async () => {
    await act(async () => {
      root.render(
        <ContentThumbnail
          thumbnailPath="https://example.com/expired-thumbnail.jpg"
          title="Reel teste"
          contentType="reel"
        />
      );
    });

    const image = container.querySelector("img");
    expect(image).not.toBeNull();

    await act(async () => {
      image?.dispatchEvent(new Event("error"));
    });

    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("🎥");
  });
});
