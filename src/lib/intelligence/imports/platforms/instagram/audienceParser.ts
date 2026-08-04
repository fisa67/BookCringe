import type { ImportBatch, NormalizeResult, ParseResult, ParserInput } from "@/lib/intelligence/imports/types";
import type { ImporterDefinition } from "@/lib/intelligence/imports/contracts";
import type { PlatformParserContract } from "@/lib/intelligence/imports/platforms/shared";
import {
  matchesAudienceHistoryHeaders,
  normalizeAudienceHistoryRecords,
  parseAudienceHistoryRows,
  type InstagramAudienceHistoryParsedRecord,
} from "@/lib/intelligence/imports/platforms/instagram/audienceHistory";
import {
  matchesAudienceActivityHeaders,
  normalizeAudienceActivityRecords,
  parseAudienceActivityRows,
  type InstagramAudienceActivityParsedRecord,
} from "@/lib/intelligence/imports/platforms/instagram/audienceActivity";
import {
  matchesAudienceDemographicsHeaders,
  normalizeAudienceDemographicsRecords,
  parseAudienceDemographicsRows,
  type InstagramAudienceDemographicsParsedRecord,
} from "@/lib/intelligence/imports/platforms/instagram/audienceDemographics";
import {
  matchesAudienceTerritoryHeaders,
  normalizeAudienceTerritoryRecords,
  parseAudienceTerritoryRows,
  type InstagramAudienceTerritoryParsedRecord,
} from "@/lib/intelligence/imports/platforms/instagram/audienceTerritories";
import type { InstagramAudienceNormalizedRecord } from "@/lib/intelligence/imports/platforms/instagram/audienceTypes";

/**
 * Adapter único do Instagram para os relatórios de audiência — "Toda
 * plataforma possui Adapter" (singular, `ARCHITECTURE_FREEZE_v0.1.md`)
 * continua valendo: por fora, é só um `parser` + `normalizer`, iguais a
 * qualquer outro `ImporterDefinition`. Por dentro, como o Instagram exporta
 * 4 formatos de arquivo bem diferentes para a mesma família de dados
 * (audiência), o `parse()` reconhece qual dos 4 recebeu pelo formato dos
 * cabeçalhos (mesma função `matchColumns` que o detector genérico usa) e
 * delega para o módulo daquele formato — nenhum parser genérico entre
 * plataformas, só dispatch dentro do próprio Adapter do Instagram.
 *
 * Recebe `ParserInput.payload` como `string[][]` (linhas já extraídas,
 * tanto de um CSV quanto de um `.xlsx` via `imports/xlsx.ts` — o parser não
 * sabe nem precisa saber de onde vieram), nunca uma string de CSV — assim o
 * mesmo Adapter processa `.xlsx` sem depender de reconstruir um CSV
 * sintético.
 */

export type InstagramAudienceParsedRecord =
  | InstagramAudienceHistoryParsedRecord
  | InstagramAudienceActivityParsedRecord
  | InstagramAudienceDemographicsParsedRecord
  | InstagramAudienceTerritoryParsedRecord;

export type InstagramAudienceParser = PlatformParserContract<"instagram", InstagramAudienceParsedRecord>;

function asRows(payload: unknown): string[][] | null {
  if (!Array.isArray(payload)) return null;
  if (!payload.every((row) => Array.isArray(row))) return null;
  return payload as string[][];
}

export const instagramAudienceParser: InstagramAudienceParser = {
  platform: "instagram",
  async parse(input: ParserInput): Promise<ParseResult<InstagramAudienceParsedRecord>> {
    if (input.platform !== "instagram") {
      return {
        records: [],
        issues: [
          {
            stage: "parse",
            code: "instagram-platform-mismatch",
            message: "O Adapter de audiência do Instagram recebeu um arquivo de outra plataforma.",
          },
        ],
      };
    }

    const rows = asRows(input.payload);
    if (!rows) {
      return {
        records: [],
        issues: [
          {
            stage: "parse",
            code: "instagram-audience-payload-not-rows",
            message: "O relatório de audiência do Instagram deve ser recebido como linhas (string[][]).",
          },
        ],
      };
    }

    const [headers] = rows;
    if (!headers) {
      return {
        records: [],
        issues: [
          {
            stage: "parse",
            code: "instagram-audience-empty",
            message: "O relatório de audiência do Instagram está vazio.",
          },
        ],
      };
    }

    if (matchesAudienceHistoryHeaders(headers)) {
      return parseAudienceHistoryRows({ rows, fileId: input.file.id });
    }
    if (matchesAudienceActivityHeaders(headers)) {
      return parseAudienceActivityRows({ rows, fileId: input.file.id });
    }
    if (matchesAudienceDemographicsHeaders(headers)) {
      return parseAudienceDemographicsRows({ rows, fileId: input.file.id });
    }
    if (matchesAudienceTerritoryHeaders(headers)) {
      return parseAudienceTerritoryRows({ rows, fileId: input.file.id });
    }

    return {
      records: [],
      issues: [
        {
          stage: "parse",
          code: "instagram-audience-unrecognized-format",
          message: "Não foi possível reconhecer este relatório de audiência do Instagram (cabeçalhos não batem com FollowerHistory, FollowerActivity, FollowerGender nem FollowerTopTerritories).",
        },
      ],
    };
  },
};

/**
 * Núcleo do normalize, com `referenceDate` exposto para quem precisar de
 * resultado determinístico (testes, e o preview standalone em
 * `audiencePreview.ts`) — a versão exigida pelo contrato `ImportNormalizer`
 * (sem esse parâmetro extra, ver `instagramAudienceNormalizer` abaixo) só
 * chama esta função sem passar `referenceDate`, usando o padrão "agora".
 */
export async function normalizeInstagramAudienceRecords(params: {
  records: readonly InstagramAudienceParsedRecord[];
  batch: ImportBatch;
  referenceDate?: Date;
}): Promise<NormalizeResult<InstagramAudienceNormalizedRecord>> {
  const historyRecords = params.records.filter((record) => record.kind === "audience_history");
  const activityRecords = params.records.filter((record) => record.kind === "audience_activity");
  const demographicsRecords = params.records.filter((record) => record.kind === "audience_demographics");
  const territoryRecords = params.records.filter((record) => record.kind === "audience_territories");

  const results = [
    historyRecords.length
      ? normalizeAudienceHistoryRecords({ records: historyRecords, batch: params.batch, referenceDate: params.referenceDate })
      : null,
    activityRecords.length
      ? normalizeAudienceActivityRecords({ records: activityRecords, batch: params.batch, referenceDate: params.referenceDate })
      : null,
    demographicsRecords.length
      ? normalizeAudienceDemographicsRecords({ records: demographicsRecords, batch: params.batch })
      : null,
    territoryRecords.length
      ? normalizeAudienceTerritoryRecords({ records: territoryRecords, batch: params.batch })
      : null,
  ].filter((result): result is NormalizeResult<InstagramAudienceNormalizedRecord> => result !== null);

  return {
    records: results.flatMap((result) => result.records),
    issues: results.flatMap((result) => result.issues),
  };
}

export const instagramAudienceNormalizer = {
  platform: "instagram" as const,
  normalize(
    records: InstagramAudienceParsedRecord[],
    batch: ImportBatch
  ): Promise<NormalizeResult<InstagramAudienceNormalizedRecord>> {
    return normalizeInstagramAudienceRecords({ records, batch });
  },
};

export const instagramAudienceImporter = {
  platform: "instagram",
  parser: instagramAudienceParser,
  normalizer: instagramAudienceNormalizer,
} satisfies ImporterDefinition<InstagramAudienceParsedRecord, InstagramAudienceNormalizedRecord>;

/** Atalho conveniente para quem só quer o resultado normalizado final (mesmo padrão de `normalizeYouTubeStudioCsv`). */
export async function normalizeInstagramAudienceRows(params: {
  batch: ImportBatch;
  input: ParserInput;
  referenceDate?: Date;
}): Promise<NormalizeResult<InstagramAudienceNormalizedRecord>> {
  const parseResult = await instagramAudienceParser.parse(params.input);
  const normalizeResult = await normalizeInstagramAudienceRecords({
    records: parseResult.records,
    batch: params.batch,
    referenceDate: params.referenceDate,
  });

  return {
    records: normalizeResult.records,
    issues: [...parseResult.issues, ...normalizeResult.issues],
  };
}
