import type { ReadingStats, DetailedBook, ClubSession } from "@/lib/types";

export const mockStats: ReadingStats = {
  booksRead: 47,
  pagesRead: 14_823,
  hoursRead: 312,
  avgRating: 3.8,
  authorsRead: 39,
  countriesRead: 18,
  genresRead: 12,
  annualGoal: 52,
  annualProgress: 47,
};

export const mockRecentBooks: DetailedBook[] = [
  {
    id: "1",
    title: "A Metamorfose",
    author: "Franz Kafka",
    rating: 4,
    pages: 104,
    year: 1915,
    genre: ["Ficção", "Clássico"],
    country: "Alemanha",
    readAt: "2024-11-15",
    status: "finished",
    amazonUrl: "https://www.amazon.com.br/dp/6556392975",
  },
  {
    id: "2",
    title: "Normal People",
    author: "Sally Rooney",
    rating: 4,
    pages: 266,
    year: 2018,
    genre: ["Romance Contemporâneo", "Drama"],
    country: "Irlanda",
    readAt: "2024-10-28",
    status: "finished",
    amazonUrl: "https://www.amazon.com.br/dp/0571334650",
  },
  {
    id: "3",
    title: "O Senhor dos Anéis",
    author: "J.R.R. Tolkien",
    rating: 5,
    pages: 1178,
    year: 1954,
    genre: ["Fantasia", "Clássico"],
    country: "Reino Unido",
    readAt: "2024-09-10",
    status: "finished",
    amazonUrl: "https://www.amazon.com.br/dp/8533613377",
  },
  {
    id: "4",
    title: "Torto Arado",
    author: "Itamar Vieira Junior",
    rating: 5,
    pages: 264,
    year: 2019,
    genre: ["Ficção Brasileira", "Drama"],
    country: "Brasil",
    readAt: "2024-08-22",
    status: "finished",
    amazonUrl: "https://www.amazon.com.br/dp/6587234109",
  },
];

export const mockClubSessions: ClubSession[] = [
  {
    id: "1",
    book: { title: "Diário de uma Jovem", author: "Anne Frank" },
    date: "2025-01-25",
    theme: "Memórias que resistem",
    description:
      "Uma noite para falar sobre resistência, esperança e o poder da escrita.",
    isUpcoming: true,
  },
  {
    id: "2",
    book: { title: "Cem Anos de Solidão", author: "Gabriel García Márquez" },
    date: "2024-12-14",
    theme: "Realismo mágico",
    description: "A família Buendía e os mistérios de Macondo.",
    isUpcoming: false,
  },
];
