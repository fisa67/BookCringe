/**
 * Clube de Leitura BookCringe — Calendário 2026
 *
 * Para criar o calendário de 2027, basta criar bookclub2027.ts com a
 * mesma estrutura e importá-lo na página. Nenhum componente precisa
 * ser alterado.
 *
 * status:
 *   "finished"   → leitura concluída (mostrar nota e Reel)
 *   "reading"    → leitura do mês atual (destaque automático)
 *   "comingSoon" → próxima leitura confirmada
 *   "future"     → leituras planejadas para o restante do ano
 */

import type { BookClubEntry } from "@/lib/bookclub";

export const bookclub2026: BookClubEntry[] = [
  {
    month: "Janeiro",
    title: "Água Fresca para as Flores",
    author: "Valérie Perrin",
    rating: 5,
    status: "finished",
    instagram: "https://www.instagram.com/reel/DXHxGnppgid/",
    amazonUrl: "https://www.amazon.com.br/dp/8551004999",
  },
  {
    month: "Fevereiro",
    title: "Relatos de um Gato Viajante",
    author: "Hiro Arikawa",
    rating: 5,
    status: "finished",
    instagram: "https://www.instagram.com/reel/DXZx2rZgCy9/",
    amazonUrl: "https://www.amazon.com.br/dp/6586489148",
  },
  {
    month: "Março",
    title: "Nunca Minta",
    author: "Freida McFadden",
    rating: 4,
    status: "finished",
    instagram: "https://www.instagram.com/reel/DZIMOBXO1vz/",
    amazonUrl: "https://www.amazon.com.br/dp/6557825682",
  },
  {
    month: "Abril",
    title: "Eu Receberia as Piores Notícias dos Seus Lindos Lábios",
    author: "Marçal Aquino",
    rating: 5,
    status: "finished",
    instagram: "https://www.instagram.com/reel/DZ241eqgm1U/",
    amazonUrl: "https://www.amazon.com.br/dp/8535934448",
  },
  {
    month: "Maio",
    title: "Evidências de uma Traição",
    author: "Taylor Jenkins Reid",
    status: "comingSoon",
  },
  {
    month: "Junho",
    title: "Kafka à Beira-Mar",
    author: "Haruki Murakami",
    status: "reading",
  },
  {
    month: "Julho",
    title: "Sobre os Ossos dos Mortos",
    author: "Olga Tokarczuk",
    status: "future",
  },
  {
    month: "Agosto",
    title: "Chocolates Quentes às Quintas-feiras",
    author: "Durian Sukegawa",
    status: "future",
  },
  {
    month: "Setembro",
    title: "Cabra da Peste",
    author: "Luan Barbosa",
    status: "future",
  },
  {
    month: "Outubro",
    title: "Não Me Abandone Jamais",
    author: "Kazuo Ishiguro",
    status: "future",
  },
  {
    month: "Novembro",
    title: "A Vida pela Frente",
    author: "Romain Gary (Émile Ajar)",
    status: "future",
  },
  {
    month: "Dezembro",
    title: "Alta Fidelidade",
    author: "Nick Hornby",
    status: "future",
  },
];
