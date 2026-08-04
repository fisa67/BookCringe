"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const INTELLIGENCE_NAV_ITEMS = [
  { href: "/admin/intelligence", label: "Dashboard" },
  { href: "/admin/intelligence/importacoes", label: "Importações" },
  { href: "/admin/intelligence/conteudos", label: "Conteúdos" },
  { href: "/admin/intelligence/chat", label: "Chat" },
  { href: "/admin/intelligence/plataformas", label: "Plataformas" },
  { href: "/admin/intelligence/ia", label: "IA" },
  { href: "/admin/intelligence/relatorios", label: "Relatórios" },
  { href: "/admin/intelligence/configuracoes", label: "Configurações" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin/intelligence") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function IntelligenceNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação do BookCringe Intelligence"
      className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-3 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:pb-0 md:pr-4"
    >
      {INTELLIGENCE_NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
