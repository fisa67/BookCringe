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

export const mockRecentBooks = [
  {
    title: "O Segredo Final",
    author: "Dan Brown",
    rating: 5,
    readAt: "2026-06-29",
  },
  {
    title: "A Morte de Ivan Ilitch",
    author: "Liev Tolstói",
    rating: 5,
    readAt: "2026-06-20",
  },
  {
    title: "Walking the Talk",
    author: "Carolyn Taylor",
    rating: 5,
    readAt: "2026-06-15",
  },
  {
    title: "A Máquina do Caos",
    author: "Max Fisher",
    rating: 5,
    readAt: "2026-06-10",
  },
];