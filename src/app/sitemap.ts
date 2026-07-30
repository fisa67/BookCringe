import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getBooks } from "@/lib/services/bookService";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const books = await getBooks();
  const bookEntries: MetadataRoute.Sitemap = (books ?? [])
    .filter((book) => Boolean(book.slug))
    .map((book) => ({
      url: `${SITE_URL}/livro/${book.slug}`,
      lastModified: book.updated_at ? new Date(book.updated_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/sobre`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/biblioteca`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/recomendacoes`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/ofertas`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/bookcringe-store`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/conteudos`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...bookEntries,
    {
      url: `${SITE_URL}/clube-de-leitura`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/estatisticas`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/trabalhe-comigo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contato`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];
}
