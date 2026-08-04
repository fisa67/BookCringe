import type { NormalizedImportRecord, ParsedImportRecord } from "@/lib/intelligence/imports/types";

/**
 * `datasetKind` explícito dos relatórios de audiência do Instagram —
 * proposital e deliberadamente um tipo local a este Adapter, não algo
 * exportado de `imports/types.ts`/`contracts.ts` (que continuam sem saber o
 * que é "audiência" ou o que é "Instagram"). Cada plataforma que precisar
 * de múltiplos formatos define o seu próprio tipo assim, no seu próprio
 * `platforms/<plataforma>/`; o Instagram e um futuro TikTok (baseado em
 * campanhas pagas, não em audiência — ver `platforms/tiktok/` quando essa
 * sprint chegar) nunca compartilham este union.
 *
 * Hoje isso só existe no nível de tipo/contrato do pipeline de import (o
 * `payload` de cada `NormalizedImportRecord`) — persistência continua fora
 * de escopo. Quando uma sprint futura implementar a persistência do
 * Instagram, este é o campo já pronto para virar a chave composta
 * `(platform, kind)` do Dataset, prevista em
 * `supabase/migrations/20260801_intelligence_datasets.sql`
 * ("quando um adapter passar a produzir mais de um tipo de relatório, esta
 * constraint evolui para uma chave composta") — sem precisar redesenhar o
 * Adapter para isso.
 */
export type InstagramDatasetKind =
  | "audience_history"
  | "audience_activity"
  | "audience_demographics"
  | "audience_territories";

/** Rótulo amigável de cada `datasetKind`, para exibição na Detection Preview (`ImportCenter.tsx`). */
export const INSTAGRAM_DATASET_KIND_LABELS: Record<InstagramDatasetKind, string> = {
  audience_history: "Histórico de seguidores",
  audience_activity: "Atividade por hora",
  audience_demographics: "Distribuição por gênero",
  audience_territories: "Distribuição por território",
};

export interface InstagramAudienceHistoryPayload extends Record<string, unknown> {
  datasetKind: "audience_history";
  /** ISO `YYYY-MM-DD` — ano já resolvido, ver `audienceDate.ts`. */
  date: string;
  followers: number;
  followersDelta: number;
}

export interface InstagramAudienceActivityPayload extends Record<string, unknown> {
  datasetKind: "audience_activity";
  /** ISO `YYYY-MM-DD` — ano já resolvido, ver `audienceDate.ts`. */
  date: string;
  /** 0 a 23. */
  hour: number;
  activeFollowers: number;
}

export interface InstagramAudienceDemographicsPayload extends Record<string, unknown> {
  datasetKind: "audience_demographics";
  /** Ex.: "Male", "Female", "Other". */
  label: string;
  /** 0 a 1. */
  distribution: number;
}

export interface InstagramAudienceTerritoryPayload extends Record<string, unknown> {
  datasetKind: "audience_territories";
  /** Código/nome do território como veio do export (ex.: "BR", "Others"). */
  territory: string;
  /** 0 a 1. */
  distribution: number;
}

export type InstagramAudiencePayload =
  | InstagramAudienceHistoryPayload
  | InstagramAudienceActivityPayload
  | InstagramAudienceDemographicsPayload
  | InstagramAudienceTerritoryPayload;

export interface InstagramAudienceParsedRecord extends ParsedImportRecord<"instagram"> {
  /** Qual dos 4 formatos esta linha veio de — usado pelo normalizer composto (`audienceParser.ts`) para despachar sem duck-typing. */
  kind: InstagramDatasetKind;
  fileId: string;
  sourceRecord: Record<string, unknown>;
}

export type InstagramAudienceNormalizedRecord = NormalizedImportRecord<"instagram", InstagramAudiencePayload>;
