import Link from "next/link";
import { getBooksCount } from "@/lib/services/bookService";
import { getReadingsCount } from "@/lib/services/bookReadingService";
import { getContentsCount } from "@/lib/services/contentService";
import { getStatisticsCount } from "@/lib/services/statsService";
import {
  getBookClubMonthsCount,
  getBookClubYearsCount,
} from "@/lib/services/clubService";

const SHORTCUTS = [
  { href: "/admin/books", label: "Biblioteca" },
  { href: "/admin/bookclub", label: "Clube de Leitura" },
  { href: "/admin/content", label: "Conteúdo" },
  { href: "/admin/stats", label: "Estatísticas" },
  { href: "/admin/settings", label: "Configurações" },
];

function formatCount(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pt-BR");
}

export default async function AdminPage() {
  const [
    booksCount,
    readingsCount,
    contentsCount,
    statisticsCount,
    clubYearsCount,
    clubMonthsCount,
  ] = await Promise.all([
    getBooksCount(),
    getReadingsCount(),
    getContentsCount(),
    getStatisticsCount(),
    getBookClubYearsCount(),
    getBookClubMonthsCount(),
  ]);

  const stats = [
    { label: "Livros", value: booksCount },
    { label: "Leituras", value: readingsCount },
    { label: "Conteúdos", value: contentsCount },
    { label: "Estatísticas", value: statisticsCount },
    { label: "Anos do clube", value: clubYearsCount },
    { label: "Meses do clube", value: clubMonthsCount },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-lg shadow-slate-950/30">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Visão geral</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Painel BookCringe</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Use esta área para administrar Biblioteca, Conteúdo, Clube de Leitura, Estatísticas e Configurações do site.
        </p>
      </div>

      <section aria-label="Números gerais" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{formatCount(stat.value)}</p>
          </div>
        ))}
      </section>

      <section aria-label="Atalhos" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SHORTCUTS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-left transition hover:border-slate-600 hover:bg-slate-900"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            <p className="mt-3 text-xl font-semibold text-white">Ir para {item.label}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
