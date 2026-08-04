import type {
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import type { ImportPlatform } from "@/lib/intelligence/imports/types";
import type { Question } from "@/lib/intelligence/questions/types";
import {
  buildAudienceDatasetSummaries,
  type AudienceDatasetSummary,
} from "@/lib/intelligence/audience/summary";

export interface AudienceQuestionContext {
  now: Date;
  datasets: IntelligenceDatasetRecord[];
  metrics: IntelligenceMetricRecord[];
}

interface AudienceAnswerBase {
  datasetId: string;
  datasetName: string;
  platform: ImportPlatform;
}

export interface FollowerGrowthAnswerData extends AudienceAnswerBase {
  growth: number;
  followers?: number;
  measuredAt: string;
}

export interface ActivityPeakAnswerData extends AudienceAnswerBase {
  activeFollowers: number;
  measuredAt: string;
  hour: number;
}

export interface TopTerritoryAnswerData extends AudienceAnswerBase {
  territory: string;
  share: number;
}

export interface PrimaryAudienceAnswerData extends AudienceAnswerBase {
  label: string;
  share: number;
}

function summaries(context: AudienceQuestionContext): AudienceDatasetSummary[] {
  return buildAudienceDatasetSummaries(context.datasets, context.metrics);
}

function base(summary: AudienceDatasetSummary): AudienceAnswerBase {
  return {
    datasetId: summary.datasetId,
    datasetName: summary.datasetName,
    platform: summary.platform,
  };
}

export const followerGrowthQuestion: Question<
  AudienceQuestionContext,
  FollowerGrowthAnswerData
> = {
  id: "audience-follower-growth",
  question: "Como está o crescimento de seguidores?",
  answer(context) {
    const candidate = summaries(context)
      .filter((summary) => summary.followerGrowth)
      .sort((a, b) =>
        (b.followerGrowth?.measuredAt ?? "").localeCompare(
          a.followerGrowth?.measuredAt ?? ""
        )
      )[0];
    const data: FollowerGrowthAnswerData | null = candidate?.followerGrowth
      ? {
          ...base(candidate),
          growth: candidate.followerGrowth.value,
          followers: candidate.followers?.value,
          measuredAt: candidate.followerGrowth.measuredAt,
        }
      : null;

    return {
      questionId: "audience-follower-growth",
      question: "Como está o crescimento de seguidores?",
      answeredAt: context.now.toISOString(),
      hasAnswer: data !== null,
      data,
      summary: data
        ? `A audiência teve ${data.growth >= 0 ? "+" : ""}${data.growth.toLocaleString("pt-BR")} seguidor(es) na medição mais recente${data.followers === undefined ? "." : `, chegando a ${data.followers.toLocaleString("pt-BR")}.`}`
        : "Ainda não há histórico de seguidores suficiente para responder.",
    };
  },
};

export const activityPeakQuestion: Question<
  AudienceQuestionContext,
  ActivityPeakAnswerData
> = {
  id: "audience-activity-peak",
  question: "Qual é o pico de atividade da audiência?",
  answer(context) {
    const candidate = summaries(context)
      .filter((summary) => summary.activityPeak)
      .sort((a, b) =>
        (b.activityPeak?.value ?? 0) - (a.activityPeak?.value ?? 0)
      )[0];
    const data: ActivityPeakAnswerData | null = candidate?.activityPeak
      ? {
          ...base(candidate),
          activeFollowers: candidate.activityPeak.value,
          measuredAt: candidate.activityPeak.measuredAt,
          hour: new Date(candidate.activityPeak.measuredAt).getUTCHours(),
        }
      : null;

    return {
      questionId: "audience-activity-peak",
      question: "Qual é o pico de atividade da audiência?",
      answeredAt: context.now.toISOString(),
      hasAnswer: data !== null,
      data,
      summary: data
        ? `O pico de atividade ocorre às ${data.hour}h, com ${data.activeFollowers.toLocaleString("pt-BR")} seguidor(es) ativo(s).`
        : "Ainda não há dados de atividade da audiência para responder.",
    };
  },
};

export const topTerritoryQuestion: Question<
  AudienceQuestionContext,
  TopTerritoryAnswerData
> = {
  id: "audience-top-territory",
  question: "Qual é o principal território da audiência?",
  answer(context) {
    const candidates = summaries(context)
      .map((summary) => ({ summary, entry: summary.territoryDistribution[0] }))
      .filter(
        (candidate): candidate is {
          summary: AudienceDatasetSummary;
          entry: NonNullable<typeof candidate.entry>;
        } => Boolean(candidate.entry)
      )
      .sort((a, b) => b.entry.value - a.entry.value);
    const candidate = candidates[0];
    const data: TopTerritoryAnswerData | null = candidate
      ? {
          ...base(candidate.summary),
          territory: candidate.entry.label,
          share: candidate.entry.value,
        }
      : null;

    return {
      questionId: "audience-top-territory",
      question: "Qual é o principal território da audiência?",
      answeredAt: context.now.toISOString(),
      hasAnswer: data !== null,
      data,
      summary: data
        ? `${data.territory} é o principal território, com ${Math.round(data.share * 100)}% da audiência.`
        : "Ainda não há distribuição de territórios para responder.",
    };
  },
};

export const primaryAudienceQuestion: Question<
  AudienceQuestionContext,
  PrimaryAudienceAnswerData
> = {
  id: "audience-primary-segment",
  question: "Qual é a principal audiência?",
  answer(context) {
    const candidates = summaries(context)
      .map((summary) => ({ summary, entry: summary.genderDistribution[0] }))
      .filter(
        (candidate): candidate is {
          summary: AudienceDatasetSummary;
          entry: NonNullable<typeof candidate.entry>;
        } => Boolean(candidate.entry)
      )
      .sort((a, b) => b.entry.value - a.entry.value);
    const candidate = candidates[0];
    const data: PrimaryAudienceAnswerData | null = candidate
      ? {
          ...base(candidate.summary),
          label: candidate.entry.label,
          share: candidate.entry.value,
        }
      : null;

    return {
      questionId: "audience-primary-segment",
      question: "Qual é a principal audiência?",
      answeredAt: context.now.toISOString(),
      hasAnswer: data !== null,
      data,
      summary: data
        ? `${data.label} representa a principal audiência, com ${Math.round(data.share * 100)}% da distribuição.`
        : "Ainda não há distribuição de gênero para responder.",
    };
  },
};
