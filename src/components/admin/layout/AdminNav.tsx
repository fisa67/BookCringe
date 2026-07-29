"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Navegação horizontal do CMS — mostrada em todas as páginas de `/admin/*`
 * (montada em `src/app/admin/layout.tsx`, então cobre listagens, formulários
 * de criação/edição etc. automaticamente). Evita ter que voltar manualmente
 * para `/admin` para trocar de área.
 *
 * "Histórico" aponta para `/admin/stats` (relatórios de leitura, não
 * confundir com o histórico da Recomendação do mês, em "Recomendações").
 */
const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/books", label: "Livros" },
  { href: "/admin/content", label: "Conteúdos" },
  { href: "/admin/bookclub", label: "Clube do Livro" },
  { href: "/admin/stats", label: "Histórico" },
  { href: "/admin/recommendations", label: "Recomendações" },
  { href: "/admin/subscribers", label: "Assinantes" },
  { href: "/admin/newsletters", label: "Newsletters" },
] as const;

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMobileOpen(false), 0);
    return () => clearTimeout(timeout);
  }, [pathname]);

  // Tela de login: sem sessão/seções para navegar ainda.
  if (pathname === "/admin/login") return null;

  const showBackLink = pathname !== "/admin";
  const currentLabel = ADMIN_NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href))?.label;

  return (
    <div className="border-t border-slate-800/80">
      <div className="mx-auto max-w-6xl px-6">
        {/* Desktop */}
        <div className="hidden md:flex items-center h-12">
          {showBackLink && (
            <>
              <Link
                href="/admin"
                className="shrink-0 text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Voltar para o painel
              </Link>
              <span className="mx-3 h-4 w-px bg-slate-700" aria-hidden="true" />
            </>
          )}
          <nav className="flex items-center gap-1" aria-label="Navegação do CMS">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    active
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center justify-between h-12">
          <span className="text-sm font-semibold text-white">{currentLabel ?? "Menu"}</span>
          <button
            onClick={() => setIsMobileOpen((v) => !v)}
            aria-label={isMobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileOpen}
            className="p-2 -mr-2 rounded-md text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <div className="w-5 flex flex-col gap-1.5">
              <span
                className={cn(
                  "block h-0.5 bg-current transition-transform duration-200 origin-center",
                  isMobileOpen ? "rotate-45 translate-y-2" : ""
                )}
              />
              <span
                className={cn(
                  "block h-0.5 bg-current transition-opacity duration-200",
                  isMobileOpen ? "opacity-0" : ""
                )}
              />
              <span
                className={cn(
                  "block h-0.5 bg-current transition-transform duration-200 origin-center",
                  isMobileOpen ? "-rotate-45 -translate-y-2" : ""
                )}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 border-t border-slate-800 bg-slate-900",
          isMobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="max-w-6xl mx-auto px-6 py-3 flex flex-col gap-1" aria-label="Navegação do CMS (mobile)">
          {showBackLink && (
            <Link
              href="/admin"
              className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Voltar para o painel
            </Link>
          )}
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
