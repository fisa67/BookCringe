/**
 * BookCringe — Recomendações curatoriais
 *
 * Esta lista representa os livros em destaque no BookCringe.
 * Não é a biblioteca completa do Filipe.
 *
 * Os livros exibidos aqui podem possuir:
 * - Reel publicado
 * - Resenha
 * - Conteúdo especial
 * - Parceria com editora
 *
 * Para adicionar capa local:
 * cover: "/books/covers/nome-do-arquivo.jpg"
 */

import type { Book } from "@/lib/types";

export interface RecommendedBook extends Book {
  id: string;
  blurb: string;
  tags: string[];
  year?: number;
}

export const recommendations: RecommendedBook[] = [
  {
    id: "morte-ivan-ilitch",
    title: "A Morte de Ivan Ilitch",
    author: "Liev Tolstói",
    blurb: "Uma das novelas mais impactantes sobre vida, morte e sentido da existência.",
    tags: ["Clássico", "Literatura Russa"],
    status: "finished",
    cover: "/books/covers/a-morte-de-ivan-ilitch.jpg",
  },

  {
    id: "segredo-final",
    title: "O Segredo Final",
    author: "Dan Brown",
    blurb: "Suspense repleto de códigos, inteligência artificial e reviravoltas.",
    tags: ["Suspense", "Mistério"],
    status: "finished",
    cover: "/books/covers/o-segredo-final.jpg",
  },

  {
    id: "walking-the-talk",
    title: "Walking the Talk",
    author: "Carolyn Taylor",
    blurb: "Como líderes transformam cultura através do exemplo.",
    tags: ["Liderança", "Negócios"],
    status: "finished",
    cover: "/books/covers/walking-the-talk.jpg",
  },

  {
    id: "maquina-do-caos",
    title: "A Máquina do Caos",
    author: "Max Fisher",
    blurb: "Uma investigação sobre redes sociais, polarização e manipulação.",
    tags: ["Tecnologia", "Sociedade"],
    status: "finished",
    cover: "/books/covers/a-maquina-do-caos.jpg",
  },

  {
    id: "era-da-influencia",
    title: "A Era da Influência",
    author: "João Pedro Paes Leme",
    blurb: "Os bastidores da creator economy e do marketing de influência.",
    tags: ["Marketing", "Negócios"],
    status: "finished",
    cover: "/books/covers/a-era-da-influencia.jpg",
  },

  {
    id: "vicio-dos-livros",
    title: "O Vício dos Livros",
    author: "Afonso Cruz",
    blurb: "Uma apaixonante homenagem aos leitores e ao universo dos livros.",
    tags: ["Literatura", "Livros"],
    status: "finished",
    cover: "/books/covers/o-vicio-dos-livros.jpg",
  },

  {
    id: "knulp",
    title: "Knulp",
    author: "Hermann Hesse",
    blurb: "Um clássico sobre liberdade, caminhos e escolhas.",
    tags: ["Clássico", "Literatura Alemã"],
    status: "finished",
    cover: "/books/covers/knulp.jpg",
  },

  {
    id: "leading-with-the-heart",
    title: "Liderando com o Coração",
    author: "Mike Krzyzewski",
    blurb: "Lições de liderança do lendário técnico Coach K.",
    tags: ["Liderança", "Esportes"],
    status: "finished",
    cover: "/books/covers/leading-with-the-heart.jpg",
  },

  {
    id: "nexus",
    title: "Nexus",
    author: "Yuval Noah Harari",
    blurb: "Uma reflexão sobre informação, redes e o futuro da humanidade.",
    tags: ["História", "Tecnologia"],
    status: "finished",
    cover: "/books/covers/nexus.jpg",
  },

  {
    id: "ikigai",
    title: "Ikigai",
    author: "Héctor García e Francesc Miralles",
    blurb: "Os princípios japoneses para uma vida longa e significativa.",
    tags: ["Desenvolvimento Pessoal"],
    status: "finished",
    cover: "/books/covers/ikigai.jpg",
  },

  {
    id: "vamos-comprar-um-poeta",
    title: "Vamos Comprar um Poeta",
    author: "Afonso Cruz",
    blurb: "Uma fábula delicada sobre arte, poesia e humanidade.",
    tags: ["Literatura", "Fábula"],
    status: "finished",
    cover: "/books/covers/vamos-comprar-um-poeta.jpg",
  },

  {
    id: "versos-para-acalmar-o-vento",
    title: "Versos para Acalmar o Vento",
    author: "Priscilla B. M. Navas",
    blurb: "Poemas sobre afeto, silêncio e recomeços.",
    tags: ["Poesia"],
    status: "finished",
    cover: "/books/covers/versos-para-acalmar-o-vento.jpg",
  },
];