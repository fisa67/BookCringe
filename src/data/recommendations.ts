/**
 * BookCringe — Recomendações curatoriais
 *
 * Para adicionar uma capa real:
 *   cover: "https://covers.openlibrary.org/b/isbn/ISBN_AQUI-L.jpg"
 *   (substitua ISBN_AQUI pelo ISBN-13 do livro)
 *
 * Para adicionar link Amazon:
 *   amazonUrl: "https://www.amazon.com.br/dp/ASIN_AQUI"
 */

import type { Book } from "@/lib/types";

export interface RecommendedBook extends Book {
  id: string;
  /** Breve descrição editorial (1–2 frases) */
  blurb: string;
  /** Tags para filtro futuro */
  tags: string[];
  /** Ano de publicação original */
  year?: number;
}

export const recommendations: RecommendedBook[] = [
  {
    id: "rec-01",
    title: "Torto Arado",
    author: "Itamar Vieira Junior",
    blurb:
      "Épico e lírico sobre duas irmãs que crescem em terras áridas do sertão baiano. Um dos mais importantes romances brasileiros recentes.",
    tags: ["Ficção Brasileira", "Drama", "Premiado"],
    year: 2019,
    status: "finished",
    amazonUrl: "https://www.amazon.com.br/dp/6587234109",
    cover: "https://covers.openlibrary.org/b/isbn/9786587234106-L.jpg",
  },
  {
    id: "rec-02",
    title: "A Menina que Roubava Livros",
    author: "Markus Zusak",
    blurb:
      "Narrada pela Morte, uma história sobre palavras, guerra e a força da leitura como ato de resistência.",
    tags: ["Ficção Histórica", "YA", "Emocionante"],
    year: 2005,
    status: "finished",
    amazonUrl: "https://www.amazon.com.br/dp/8501079472",
    cover: "https://covers.openlibrary.org/b/isbn/9780375842207-L.jpg",
  },
  {
    id: "rec-03",
    title: "Normal People",
    author: "Sally Rooney",
    blurb:
      "Dois jovens irlandeses que se atraem e se afastam ao longo dos anos. Romance contemporâneo e preciso sobre classe, amor e identidade.",
    tags: ["Romance Contemporâneo", "Drama"],
    year: 2018,
    status: "finished",
    amazonUrl: "https://www.amazon.com.br/dp/0571334650",
  },
  {
    id: "rec-04",
    title: "Sapiens: Uma Breve História da Humanidade",
    author: "Yuval Noah Harari",
    blurb:
      "Uma jornada de 70 mil anos pela história da nossa espécie. Essencial e perturbador.",
    tags: ["Não-ficção", "História", "Ciência"],
    year: 2011,
    status: "finished",
    amazonUrl: "https://www.amazon.com.br/dp/8535922909",
    cover: "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
  },
  {
    id: "rec-05",
    title: "Não Me Abandone Jamais",
    author: "Kazuo Ishiguro",
    blurb:
      "Três amigos crescem numa escola isolada sem saber o destino que os aguarda. Melancólico, belo e impossível de esquecer.",
    tags: ["Ficção Científica", "Drama", "Distopia"],
    year: 2005,
    status: "finished",
    amazonUrl: "https://www.amazon.com.br/dp/8535911189",
  },
  {
    id: "rec-06",
    title: "A Metamorfose",
    author: "Franz Kafka",
    blurb:
      "Gregor Samsa acorda transformado. Uma novela brevíssima com uma das primeiras frases mais memoráveis da literatura.",
    tags: ["Clássico", "Ficção Absurda"],
    year: 1915,
    status: "finished",
    amazonUrl: "https://www.amazon.com.br/dp/6556392975",
    cover: "https://covers.openlibrary.org/b/isbn/9780679722020-L.jpg",
  },
  {
    id: "rec-07",
    title: "Flores para Algernon",
    author: "Daniel Keyes",
    blurb:
      "Charlie Gordon passa por um experimento que vai transformar sua inteligência — e talvez destruí-lo. Clássico da FC americana.",
    tags: ["Ficção Científica", "Clássico", "Emocionante"],
    year: 1966,
    status: "finished",
    amazonUrl: "https://www.amazon.com.br/dp/8535909036",
  },
  {
    id: "rec-08",
    title: "Alta Fidelidade",
    author: "Nick Hornby",
    blurb:
      "Rob Fleming, dono de uma loja de discos, refaz suas top-5 listas enquanto tenta entender por que seus relacionamentos falham.",
    tags: ["Romance", "Humor", "Música"],
    year: 1995,
    status: "finished",
    amazonUrl: "https://www.amazon.com.br/dp/8535929622",
  },
];

/** Filtra recomendações por tag */
export function filterByTag(tag: string): RecommendedBook[] {
  return recommendations.filter((b) => b.tags.includes(tag));
}

/** Retorna todas as tags únicas das recomendações */
export function getAllTags(): string[] {
  return Array.from(new Set(recommendations.flatMap((b) => b.tags))).sort();
}
