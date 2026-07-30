import { describe, expect, it, vi } from "vitest";
import { uploadNewsletterImage } from "./newsletterImageService";

const uploadMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  supabaseAdminClient: {
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: "https://project.supabase.co/storage/v1/object/public/newsletter-images/test.png" },
        })),
      })),
    },
  },
}));

describe("uploadNewsletterImage", () => {
  it("rejeita tipos que não são imagens web permitidas", async () => {
    const file = new File(["<svg></svg>"], "malicious.svg", { type: "image/svg+xml" });

    await expect(uploadNewsletterImage(file)).resolves.toEqual({
      ok: false,
      error: "Formato não permitido. Use JPG, PNG ou WebP.",
    });
  });

  it("valida a assinatura binária em vez de confiar apenas no MIME declarado", async () => {
    const file = new File(["não é png"], "fake.png", { type: "image/png" });

    await expect(uploadNewsletterImage(file)).resolves.toEqual({
      ok: false,
      error: "O arquivo não corresponde a uma imagem válida.",
    });
  });

  it("envia PNG válido ao bucket de imagens e retorna URL pública", async () => {
    uploadMock.mockResolvedValue({ data: { path: "campaigns/test.png" }, error: null });
    const pngSignature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([pngSignature], "capa.png", { type: "image/png" });

    await expect(uploadNewsletterImage(file)).resolves.toMatchObject({
      ok: true,
      url: "https://project.supabase.co/storage/v1/object/public/newsletter-images/test.png",
    });
    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringMatching(/^campaigns\/\d{4}-\d{2}-\d{2}\/.+\.png$/),
      file,
      expect.objectContaining({ contentType: "image/png", upsert: false })
    );
  });

  it("informa quando a migration ainda não disponibilizou o bucket", async () => {
    uploadMock.mockResolvedValue({ data: null, error: { message: "Bucket not found" } });
    const pngSignature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([pngSignature], "capa.png", { type: "image/png" });

    await expect(uploadNewsletterImage(file)).resolves.toEqual({
      ok: false,
      error: "O bucket newsletter-images não está disponível. Execute a migration de imagens e tente novamente.",
    });
  });
});
