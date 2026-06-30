/**
 * Featured book override for the Home page.
 *
 * • Set to `null`   → the Home picks the current book automatically
 *                     (first entry with status: "reading" in bookclub2026.ts)
 *
 * • Set to a Book   → that specific book is always shown, regardless of the
 *                     club calendar.
 *
 * Examples:
 *
 *   export const featuredBook = null;
 *
 *   export const featuredBook = {
 *     title:     "Kafka à Beira-Mar",
 *     author:    "Haruki Murakami",
 *     cover:     "https://covers.openlibrary.org/b/isbn/9784101001555-L.jpg",
 *     amazonUrl: "https://www.amazon.com.br/dp/8535921893",
 *   };
 */

import type { Book } from "@/lib/types";

export const featuredBook: Book | null = null;
