import Link from "next/link";
import { mockRecentBooks } from "@/data/mock/stats";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill={i <= rating ? "var(--bc-red)" : "var(--bc-border)"}
          className="w-3.5 h-3.5"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function RecentReads() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <SectionHeader
            eyebrow="Últimas leituras"
            title="O que andei lendo"
            className="mb-0"
          />
          <Link href="/biblioteca" className="hidden sm:block">
            <Button variant="ghost" size="sm">
              Ver biblioteca →
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
          {mockRecentBooks.map((book) => (
            <div
              key={book.id}
              className="group p-5 rounded-xl border border-[var(--bc-border)] bg-white hover:border-[var(--bc-ink)]/20 hover:-translate-y-0.5 transition-all duration-200 animate-fade-up flex flex-col gap-3"
            >
              {/* Color block cover placeholder */}
              <div className="w-full h-32 rounded-lg bg-[var(--bc-surface)] flex items-center justify-center">
                <span className="text-3xl select-none">📖</span>
              </div>

              <div className="flex-1 flex flex-col gap-1.5">
                <h3 className="font-bold text-[var(--bc-ink)] leading-tight text-sm line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-xs text-[var(--bc-muted)]">{book.author}</p>
                {book.rating && <StarRating rating={book.rating} />}
              </div>

              {book.genre && (
                <div className="flex flex-wrap gap-1 mt-auto">
                  {book.genre.slice(0, 2).map((g) => (
                    <Badge key={g} variant="muted">
                      {g}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link href="/biblioteca">
            <Button variant="outline" size="sm">
              Ver toda a biblioteca
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
