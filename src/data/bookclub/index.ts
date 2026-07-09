import type { BookClubCalendarDefinition } from "@/lib/bookclub";

import bookclub2026 from "./2026";

export const bookclubCalendars = [
  bookclub2026,
] as const;

export type { BookClubCalendarDefinition } from "@/lib/bookclub";
