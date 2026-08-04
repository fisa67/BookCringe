import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceImportRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import type { ImportPlatform } from "@/lib/intelligence/imports/types";
import type { Question } from "@/lib/intelligence/questions/types";
import {
  buildCampaignDatasetSummaries,
  campaignEntryLabel,
  type CampaignEntry,
} from "@/lib/intelligence/campaign/summary";

/**
 * Perguntas mínimas de Campaign Datasets (Sprint 20.5, ADR-010) — mesmo
 * papel exercido por `questions/audienceStrategy.ts` para Audience: leem só
 * dados já persistidos (via `buildCampaignDatasetSummaries`), nunca IA.
 *
 * "Confidence" segue o mesmo conceito de `AudienceEvidenceConfidence`
 * (`audience/signals.ts`): `high` quando há pelo menos 2 campanhas
 * comparáveis, `low` quando só 1 campanha tem o dado necessário.
 */
export type CampaignEvidenceConfidence = "low" | "high";

export interface CampaignQuestionContext {
  now: Date;
  datasets: IntelligenceDatasetRecord[];
  imports: IntelligenceImportRecord[];
  metrics: IntelligenceMetricRecord[];
  contents: IntelligenceContentRecord[];
}

interface CampaignAnswerBase {
  datasetId: string;
  datasetName: string;
  platform: ImportPlatform;
  confidence: CampaignEvidenceConfidence;
  campaign: string;
  adCostBrl: number;
}

export interface BestCampaignAnswerData extends CampaignAnswerBase {
  costPerView: number;
  views: number;
}

export interface LowestCostPerFollowerAnswerData extends CampaignAnswerBase {
  costPerFollower: number;
  newFollowers: number;
}

export interface HighestAcquisitionAnswerData extends CampaignAnswerBase {
  newFollowers: number;
}

function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function allEntries(context: CampaignQuestionContext): { datasetId: string; datasetName: string; platform: ImportPlatform; entry: CampaignEntry }[] {
  return buildCampaignDatasetSummaries(
    context.datasets,
    context.imports,
    context.metrics,
    context.contents
  ).flatMap((summary) =>
      summary.entries.map((entry) => ({
        datasetId: summary.datasetId,
        datasetName: summary.datasetName,
        platform: summary.platform,
        entry,
      }))
    );
}

export const bestCampaignQuestion: Question<CampaignQuestionContext, BestCampaignAnswerData> = {
  id: "campaign-best",
  question: "Qual foi a melhor campanha (menor custo por view)?",
  answer(context) {
    const candidates = allEntries(context).filter((candidate) => candidate.entry.costPerView !== null);

    if (candidates.length === 0) {
      return {
        questionId: "campaign-best",
        question: "Qual foi a melhor campanha (menor custo por view)?",
        answeredAt: context.now.toISOString(),
        hasAnswer: false,
        data: null,
        summary: "Nenhuma campanha com views registradas para calcular custo por view.",
      };
    }

    const [best] = [...candidates].sort((a, b) => a.entry.costPerView! - b.entry.costPerView!);
    const confidence: CampaignEvidenceConfidence = candidates.length >= 2 ? "high" : "low";
    const data: BestCampaignAnswerData = {
      datasetId: best.datasetId,
      datasetName: best.datasetName,
      platform: best.platform,
      confidence,
      campaign: campaignEntryLabel(best.entry),
      adCostBrl: best.entry.adCostBrl,
      costPerView: best.entry.costPerView!,
      views: best.entry.views,
    };

    return {
      questionId: "campaign-best",
      question: "Qual foi a melhor campanha (menor custo por view)?",
      answeredAt: context.now.toISOString(),
      hasAnswer: true,
      data,
      summary:
        confidence === "high"
          ? `${data.campaign} é a melhor campanha (${brl(data.costPerView)}/view) em ${data.datasetName}.`
          : `Low confidence: apenas uma campanha com custo por view disponível — ${data.campaign} (${brl(data.costPerView)}/view).`,
    };
  },
};

export const lowestCostPerFollowerQuestion: Question<CampaignQuestionContext, LowestCostPerFollowerAnswerData> = {
  id: "campaign-lowest-cost-per-follower",
  question: "Qual campanha tem o menor custo por seguidor adquirido?",
  answer(context) {
    const candidates = allEntries(context).filter((candidate) => candidate.entry.costPerFollower !== null);

    if (candidates.length === 0) {
      return {
        questionId: "campaign-lowest-cost-per-follower",
        question: "Qual campanha tem o menor custo por seguidor adquirido?",
        answeredAt: context.now.toISOString(),
        hasAnswer: false,
        data: null,
        summary: "Nenhuma campanha com seguidores adquiridos registrados para calcular custo por seguidor.",
      };
    }

    const [best] = [...candidates].sort((a, b) => a.entry.costPerFollower! - b.entry.costPerFollower!);
    const confidence: CampaignEvidenceConfidence = candidates.length >= 2 ? "high" : "low";
    const data: LowestCostPerFollowerAnswerData = {
      datasetId: best.datasetId,
      datasetName: best.datasetName,
      platform: best.platform,
      confidence,
      campaign: campaignEntryLabel(best.entry),
      adCostBrl: best.entry.adCostBrl,
      costPerFollower: best.entry.costPerFollower!,
      newFollowers: best.entry.newFollowers,
    };

    return {
      questionId: "campaign-lowest-cost-per-follower",
      question: "Qual campanha tem o menor custo por seguidor adquirido?",
      answeredAt: context.now.toISOString(),
      hasAnswer: true,
      data,
      summary:
        confidence === "high"
          ? `${data.campaign} tem o menor custo por seguidor (${brl(data.costPerFollower)}) em ${data.datasetName}.`
          : `Low confidence: apenas uma campanha com custo por seguidor disponível — ${data.campaign} (${brl(data.costPerFollower)}).`,
    };
  },
};

export const highestAcquisitionQuestion: Question<CampaignQuestionContext, HighestAcquisitionAnswerData> = {
  id: "campaign-highest-acquisition",
  question: "Qual campanha trouxe mais seguidores novos?",
  answer(context) {
    const candidates = allEntries(context).filter((candidate) => candidate.entry.newFollowers > 0);

    if (candidates.length === 0) {
      return {
        questionId: "campaign-highest-acquisition",
        question: "Qual campanha trouxe mais seguidores novos?",
        answeredAt: context.now.toISOString(),
        hasAnswer: false,
        data: null,
        summary: "Nenhuma campanha com seguidores adquiridos registrados ainda.",
      };
    }

    const [best] = [...candidates].sort((a, b) => b.entry.newFollowers - a.entry.newFollowers);
    const confidence: CampaignEvidenceConfidence = candidates.length >= 2 ? "high" : "low";
    const data: HighestAcquisitionAnswerData = {
      datasetId: best.datasetId,
      datasetName: best.datasetName,
      platform: best.platform,
      confidence,
      campaign: campaignEntryLabel(best.entry),
      adCostBrl: best.entry.adCostBrl,
      newFollowers: best.entry.newFollowers,
    };

    return {
      questionId: "campaign-highest-acquisition",
      question: "Qual campanha trouxe mais seguidores novos?",
      answeredAt: context.now.toISOString(),
      hasAnswer: true,
      data,
      summary:
        confidence === "high"
          ? `${data.campaign} trouxe mais seguidores novos (${data.newFollowers}) em ${data.datasetName}.`
          : `Low confidence: apenas uma campanha com seguidores adquiridos disponível — ${data.campaign} (${data.newFollowers}).`,
    };
  },
};
