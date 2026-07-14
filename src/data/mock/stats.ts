import type { ReadingStats, DetailedBook } from "@/lib/types";
import type {
  GenreBreakdownItem,
  CountryBreakdownItem,
  MonthlyBreakdownItem,
} from "@/lib/adapters/readingStatsAggregators";

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

/**
 * Fallback estático para os gráficos detalhados de Estatísticas
 * (`getPublicReadingStatsDetailed`). Valores idênticos aos hoje hardcoded
 * em `src/app/estatisticas/page.tsx` (genreData/countryData/monthlyData) —
 * mantidos aqui apenas como fallback do adapter; a página ainda não os
 * consome (Fase 5 fará essa troca).
 */
export const mockGenreBreakdown: GenreBreakdownItem[] = [
  { genre: "Ficção", count: 18 },
  { genre: "Clássicos", count: 9 },
  { genre: "Romance Contemporâneo", count: 8 },
  { genre: "Fantasia", count: 5 },
  { genre: "Ficção Brasileira", count: 4 },
  { genre: "Drama", count: 3 },
];

export const mockCountryBreakdown: CountryBreakdownItem[] = [
  { country: "Brasil", count: 9 },
  { country: "EUA", count: 8 },
  { country: "Reino Unido", count: 7 },
  { country: "França", count: 5 },
  { country: "Alemanha", count: 4 },
  { country: "Outros", count: 14 },
];

export const mockMonthlyBreakdown: MonthlyBreakdownItem[] = [
  { month: "Jan", books: 4 },
  { month: "Fev", books: 3 },
  { month: "Mar", books: 5 },
  { month: "Abr", books: 4 },
  { month: "Mai", books: 6 },
  { month: "Jun", books: 3 },
  { month: "Jul", books: 4 },
  { month: "Ago", books: 5 },
  { month: "Set", books: 3 },
  { month: "Out", books: 4 },
  { month: "Nov", books: 4 },
  { month: "Dez", books: 2 },
];

export const mockRecentBooks: DetailedBook[] = [
  {
    id: "1",
    title: "O Segredo Final",
    author: "Dan Brown",
    rating: 5,
    pages: 552,
    year: 2025,
    genre: ["Suspense", "Mistério"],
    country: "Estados Unidos",
    readAt: "2026-06-29",
    status: "finished",
    cover: "/books/covers/o-segredo-final.jpg",
  },
  {
    id: "2",
    title: "A Morte de Ivan Ilitch",
    author: "Liev Tolstói",
    rating: 5,
    pages: 112,
    year: 1886,
    genre: ["Clássico", "Literatura Russa"],
    country: "Rússia",
    readAt: "2026-06-20",
    status: "finished",
    cover: "/books/covers/a-morte-de-ivan-ilitch.jpg",
  },
  {
    id: "3",
    title: "Walking the Talk",
    author: "Carolyn Taylor",
    rating: 5,
    pages: 304,
    year: 2015,
    genre: ["Negócios", "Liderança"],
    country: "Austrália",
    readAt: "2026-06-15",
    status: "finished",
    cover: "/books/covers/walking-the-talk.jpg",
  },
  {
    id: "4",
    title: "A Máquina do Caos",
    author: "Max Fisher",
    rating: 5,
    pages: 400,
    year: 2022,
    genre: ["Tecnologia", "Sociedade"],
    country: "Estados Unidos",
    readAt: "2026-06-10",
    status: "finished",
    cover: "/books/covers/a-maquina-do-caos.jpg",
  },
];