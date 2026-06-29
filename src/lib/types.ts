export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  rating?: number;
  pages?: number;
  year?: number;
  genre?: string[];
  country?: string;
  readAt?: string;
  review?: string;
  status: "read" | "reading" | "wishlist";
}

export interface ReadingStats {
  booksRead: number;
  pagesRead: number;
  hoursRead: number;
  avgRating: number;
  authorsRead: number;
  countriesRead: number;
  genresRead: number;
  annualGoal: number;
  annualProgress: number;
}

export interface ClubSession {
  id: string;
  book: Pick<Book, "title" | "author" | "cover">;
  date: string;
  theme?: string;
  description?: string;
  isUpcoming: boolean;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLinks {
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  spotify?: string;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface PartnershipForm extends ContactForm {
  company?: string;
  type: "editora" | "autor" | "marca" | "outro";
}
