import type { ImportPlatform } from "@/lib/intelligence/imports/types";
import type { IntelligenceImportRowStatus } from "@/lib/types/intelligence";
import type { Insight } from "@/lib/intelligence/insights";

export interface IntelligenceDashboardSummary {
  datasetsCount: number;
  importsCount: number;
  contentsCount: number;
  /** Livros distintos que já têm ao menos um Content vinculado — não a contagem total de Livros do CMS. */
  linkedBooksCount: number;
}

export interface LatestImportSummary {
  platform: ImportPlatform;
  datasetName: string;
  fileName: string;
  startedAt: string;
  status: IntelligenceImportRowStatus;
  acceptedRecords: number;
  rejectedRecords: number;
}

export interface TopContentEntry {
  contentId: string;
  title: string;
  platform: ImportPlatform;
  views: number;
  /** Preenchido só quando o Content já foi associado a um Livro (`docs/content-matching.md`). */
  bookTitle?: string;
}

export interface PlatformDistributionEntry {
  platform: ImportPlatform;
  contentsCount: number;
  /** 0 a 1, fração do total de Contents. */
  share: number;
}

export interface MatchingRateSummary {
  linked: number;
  unlinked: number;
  total: number;
  /** 0 a 1. */
  rate: number;
}

export interface IntelligenceDashboardData {
  summary: IntelligenceDashboardSummary;
  latestImport: LatestImportSummary | null;
  topContents: TopContentEntry[];
  platformDistribution: PlatformDistributionEntry[];
  matchingRate: MatchingRateSummary;
  /**
   * Recomendações do Rules Engine (Sprint 9, `docs/intelligence-insights.md`)
   * — baseadas em regras, não em IA. Calculadas por `runIntelligenceRules`,
   * um módulo independente do Dashboard (`lib/intelligence/insights/`).
   */
  insights: Insight[];
}
