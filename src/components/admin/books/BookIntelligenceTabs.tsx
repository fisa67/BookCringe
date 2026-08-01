"use client";

import { useState, type ReactNode } from "react";

export type BookIntelligenceTabId = "overview" | "timeline" | "insights";

interface BookIntelligenceTabsProps {
  overview: ReactNode;
  timeline: ReactNode;
  insights: ReactNode;
  /** Quantidade de insights ativos — mostrada ao lado do rótulo da aba. */
  insightsCount: number;
}

const TABS: { id: BookIntelligenceTabId; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "timeline", label: "Timeline" },
  { id: "insights", label: "Insights" },
];

/**
 * Troca entre as 3 abas de "Biblioteca Inteligente" em
 * `/admin/books/[id]/edit` (Sprint 4: Participações/Indicadores, Timeline,
 * Insights). Único componente client do sprint — as 3 seções já chegam
 * totalmente renderizadas pelo Server Component da página (`page.tsx`)
 * como `ReactNode`; este componente só guarda qual aba está visível
 * (`useState`), nenhum dado é buscado aqui.
 */
export function BookIntelligenceTabs({ overview, timeline, insights, insightsCount }: BookIntelligenceTabsProps) {
  const [activeTab, setActiveTab] = useState<BookIntelligenceTabId>("overview");

  const panels: Record<BookIntelligenceTabId, ReactNode> = { overview, timeline, insights };

  return (
    <div>
      <div role="tablist" className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-slate-500 bg-slate-800 text-white"
                : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
            }`}
          >
            {tab.label}
            {tab.id === "insights" && insightsCount > 0 ? ` (${insightsCount})` : ""}
          </button>
        ))}
      </div>
      <div role="tabpanel">{panels[activeTab]}</div>
    </div>
  );
}
