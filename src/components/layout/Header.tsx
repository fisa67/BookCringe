"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-[var(--bc-cream)]/95 backdrop-blur-sm border-b border-[var(--bc-border)]"
          : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.png"
            alt="BookCringe"
            width={40}
            height={40}
            className="rounded"
            priority
          />
          <span className="font-bold text-[var(--bc-ink)] text-lg tracking-tight hidden sm:block">
            Book<span className="text-[var(--bc-red)]">Cringe</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors duration-150",
                pathname === link.href
                  ? "text-[var(--bc-red)] font-semibold"
                  : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsMobileOpen((v) => !v)}
          aria-label={isMobileOpen ? "Fechar menu" : "Abrir menu"}
          className="md:hidden p-2 rounded-md text-[var(--bc-ink)] hover:bg-[var(--bc-surface)] transition-colors"
        >
          <span className="sr-only">{isMobileOpen ? "Fechar" : "Menu"}</span>
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

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 bg-[var(--bc-cream)] border-b border-[var(--bc-border)]",
          isMobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2.5 text-sm rounded-md transition-colors",
                pathname === link.href
                  ? "text-[var(--bc-red)] font-semibold bg-[var(--bc-surface)]"
                  : "text-[var(--bc-muted)] hover:text-[var(--bc-ink)] hover:bg-[var(--bc-surface)]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
