import { describe, expect, it } from "vitest";
import { contentFormSchema } from "./content";

/**
 * `association_type` alterna quais campos aparecem no DOM
 * (`ContentAssociationFields`): "book" some com `content_category` e o
 * título manual; "general" some com `book_id`. Os testes abaixo simulam
 * exatamente o que `FormData.get()` devolve para um campo ausente do DOM —
 * `null`, não `""` — para não reintroduzir o bug em que `emptyToUndefined`
 * só tratava string vazia.
 */
describe("contentFormSchema", () => {
  const baseInput = {
    platform: "instagram" as const,
    content_type: "reel" as const,
    url: "https://instagram.com/reel/abc",
    is_featured: "false",
    published_at: null,
    thumbnail_path: null,
  };

  it("aceita conteúdo geral com book_id ausente do FormData (null, não string vazia)", () => {
    const result = contentFormSchema.safeParse({
      ...baseInput,
      association_type: "general",
      book_id: null,
      content_category: "reading",
      title: "Como criar o hábito da leitura",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.book_id).toBeNull();
      expect(result.data.content_category).toBe("reading");
      expect(result.data.title).toBe("Como criar o hábito da leitura");
    }
  });

  it("rejeita conteúdo geral sem categoria selecionada", () => {
    const result = contentFormSchema.safeParse({
      ...baseInput,
      association_type: "general",
      book_id: null,
      content_category: null,
      title: "Sem categoria",
    });

    expect(result.success).toBe(false);
  });

  it("aceita conteúdo de livro e ignora qualquer título manual (fonte é a Biblioteca)", () => {
    const result = contentFormSchema.safeParse({
      ...baseInput,
      association_type: "book",
      book_id: "9c6f1e0a-1111-4d3d-9c3a-000000000000",
      content_category: null,
      // Mesmo que um título venha no payload (ex.: campo antigo, request manipulado),
      // o transform sempre descarta para conteúdo de livro.
      title: "Título que não deveria ser salvo",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content_category).toBe("book");
      expect(result.data.title).toBeUndefined();
    }
  });

  it("rejeita conteúdo de livro sem book_id selecionado", () => {
    const result = contentFormSchema.safeParse({
      ...baseInput,
      association_type: "book",
      book_id: null,
      content_category: null,
      title: null,
    });

    expect(result.success).toBe(false);
  });
});
