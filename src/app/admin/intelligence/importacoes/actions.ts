"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireOwnerId } from "@/lib/auth/ownerId";
import { previewImportFile, type ImportPreviewResult } from "@/lib/intelligence/imports/preview";
import { parseXlsxToRows } from "@/lib/intelligence/imports/xlsx";
import { normalizeYouTubeStudioCsv } from "@/lib/intelligence/imports/platforms/youtube/parser";
import { youtubeStudioPersistence } from "@/lib/intelligence/imports/platforms/youtube/persistence";
import { normalizeInstagramAudienceRows } from "@/lib/intelligence/imports/platforms/instagram/audienceParser";
import { instagramAudiencePersistence } from "@/lib/intelligence/imports/platforms/instagram/persistence";
import { normalizeTikTokPromotionsCsv } from "@/lib/intelligence/imports/platforms/tiktok/promotionsParser";
import { tiktokPromotionsPersistence } from "@/lib/intelligence/imports/platforms/tiktok/persistence";
import { dispatchTikTokImport } from "@/lib/intelligence/imports/tiktokDispatch";
import type {
  ImportBatch,
  ImportFileDescriptor,
  ParserInput,
  PersistenceReceipt,
} from "@/lib/intelligence/imports/types";

const IMPORTS_PATH = "/admin/intelligence/importacoes";

function isXlsxFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(".xlsx");
}

function getRequiredFile(formData: FormData): File {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Nenhum arquivo selecionado.");
  }
  return file;
}

function buildFileDescriptor(file: File): ImportFileDescriptor {
  return {
    id: randomUUID(),
    name: file.name,
    size: file.size,
    mimeType: file.type || undefined,
    extension: file.name.split(".").pop(),
    format: isXlsxFile(file) ? "excel" : "unknown",
  };
}

type CsvImportPayload = { kind: "csv"; content: string };
type XlsxImportPayload = { kind: "xlsx"; buffer: Buffer };
type ImportPayload = CsvImportPayload | XlsxImportPayload;

/**
 * Lê o conteúdo do arquivo uma única vez. `confirmImportAction` depende
 * disso: reler o mesmo `File` vindo de `FormData` em Server Actions pode
 * retornar vazio ou travar (stream já consumido pelo preview), deixando a
 * UI presa em "Importando..." — bug observado em produção com TikTok.
 */
async function readImportPayload(file: File): Promise<ImportPayload> {
  if (isXlsxFile(file)) {
    return { kind: "xlsx", buffer: Buffer.from(await file.arrayBuffer()) };
  }
  return { kind: "csv", content: await file.text() };
}

function unsupportedImportReceipt(): PersistenceReceipt {
  return {
    batchId: randomUUID(),
    status: "failed",
    acceptedRecords: 0,
    rejectedRecords: 0,
    issues: [{
      stage: "persist",
      code: "unsupported-import-format",
      message: "O arquivo não corresponde a um formato com persistência disponível.",
    }],
  };
}

/**
 * Executa a Detection Preview (detector genérico + adapter da plataforma —
 * hoje YouTube e Instagram/audiência) inteiramente em memória. Nenhum dado
 * é persistido aqui; ver `confirmImportAction` para a gravação real.
 *
 * Lê o arquivo como texto (`.csv`, usado pelo YouTube) ou como bytes
 * binários (`.xlsx`, usado pelo Instagram/audiência) de acordo com a
 * extensão — `previewImportFile` decide o resto a partir daí.
 *
 * Chamada diretamente pelo componente cliente (`useImportSession`), sem
 * `<form>`/redirect, pois o resultado é renderizado inline na própria página.
 */
export async function previewImportAction(formData: FormData): Promise<ImportPreviewResult> {
  const file = getRequiredFile(formData);
  const descriptor = buildFileDescriptor(file);
  const payload = await readImportPayload(file);

  if (payload.kind === "xlsx") {
    return previewImportFile({ file: descriptor, buffer: payload.buffer });
  }

  return previewImportFile({ file: descriptor, content: payload.content });
}

/**
 * Confirma a importação do YouTube — refaz o parse + normalize do CSV
 * (determinístico e barato; a Detection Preview não guarda os
 * `NormalizedImportRecord[]`, só o resumo) e delega a gravação para
 * `youtubeStudioPersistence`: encontra/cria o Dataset do YouTube, cria o
 * Import e persiste Content/Metric para cada vídeo aceito.
 *
 * Chamada só internamente, pelo dispatcher `confirmImportAction` — a UI
 * (`useImportSession`) nunca importa esta função diretamente.
 */
export async function importYouTubeDatasetAction(formData: FormData): Promise<PersistenceReceipt> {
  const file = getRequiredFile(formData);
  const payload = await readImportPayload(file);
  if (payload.kind !== "csv") {
    return unsupportedImportReceipt();
  }
  return persistYouTubeImport(file, payload.content);
}

async function persistYouTubeImport(file: File, content: string): Promise<PersistenceReceipt> {
  const descriptor = buildFileDescriptor(file);
  const batch: ImportBatch = {
    id: randomUUID(),
    platform: "youtube",
    status: "detected",
    files: [descriptor],
    createdAt: new Date().toISOString(),
  };

  const parserInput: ParserInput = {
    batchId: batch.id,
    platform: "youtube",
    file: descriptor,
    payload: content,
  };

  const { records, issues } = await normalizeYouTubeStudioCsv({ batch, input: parserInput });

  if (records.length === 0) {
    return {
      batchId: batch.id,
      status: "failed",
      acceptedRecords: 0,
      rejectedRecords: 0,
      issues: issues.length
        ? issues
        : [{ stage: "persist", message: "Nenhum registro válido para importar." }],
    };
  }

  const ownerId = await requireOwnerId();
  const receipt = await youtubeStudioPersistence.persist(records, batch, ownerId);
  revalidatePath(IMPORTS_PATH);
  return receipt;
}

/**
 * Confirma a importação da audiência do Instagram — mesma ideia de
 * `importYouTubeDatasetAction`, mas para `.xlsx`: extrai as linhas
 * (`parseXlsxToRows`), refaz o parse + normalize (`normalizeInstagramAudienceRows`)
 * e delega a gravação para `instagramAudiencePersistence`
 * (`docs/intelligence/AUDIENCE_PERSISTENCE.md`, Sprint 14) — que persiste
 * `Metric` sem `Content`, já que audiência não tem um item individual.
 *
 * Chamada só internamente, pelo dispatcher `confirmImportAction`.
 */
export async function importInstagramAudienceDatasetAction(formData: FormData): Promise<PersistenceReceipt> {
  const file = getRequiredFile(formData);
  const payload = await readImportPayload(file);
  if (payload.kind !== "xlsx") {
    return unsupportedImportReceipt();
  }
  return persistInstagramAudienceImport(file, payload.buffer);
}

async function persistInstagramAudienceImport(file: File, buffer: Buffer): Promise<PersistenceReceipt> {
  const rows = await parseXlsxToRows(buffer);
  const descriptor = buildFileDescriptor(file);

  const batch: ImportBatch = {
    id: randomUUID(),
    platform: "instagram",
    status: "detected",
    files: [descriptor],
    createdAt: new Date().toISOString(),
  };

  const parserInput: ParserInput = {
    batchId: batch.id,
    platform: "instagram",
    file: descriptor,
    payload: rows,
  };

  const { records, issues } = await normalizeInstagramAudienceRows({ batch, input: parserInput });

  if (records.length === 0) {
    return {
      batchId: batch.id,
      status: "failed",
      acceptedRecords: 0,
      rejectedRecords: 0,
      issues: issues.length
        ? issues
        : [{ stage: "persist", message: "Nenhum registro válido para importar." }],
    };
  }

  const ownerId = await requireOwnerId();
  const receipt = await instagramAudiencePersistence.persist(records, batch, ownerId);
  revalidatePath(IMPORTS_PATH);
  return receipt;
}

export async function importTikTokPromotionsDatasetAction(formData: FormData): Promise<PersistenceReceipt> {
  const file = getRequiredFile(formData);
  const payload = await readImportPayload(file);
  if (payload.kind !== "csv") {
    return unsupportedImportReceipt();
  }
  return persistTikTokPromotionsImport(file, payload.content);
}

async function persistTikTokPromotionsImport(file: File, content: string): Promise<PersistenceReceipt> {
  const descriptor = buildFileDescriptor(file);
  descriptor.format = "csv";

  const batch: ImportBatch = {
    id: randomUUID(),
    platform: "tiktok",
    status: "detected",
    files: [descriptor],
    createdAt: new Date().toISOString(),
  };

  const input: ParserInput = {
    batchId: batch.id,
    platform: "tiktok",
    file: descriptor,
    payload: content,
  };
  const { records, issues } = await normalizeTikTokPromotionsCsv({ batch, input });

  if (records.length === 0) {
    return {
      batchId: batch.id,
      status: "failed",
      acceptedRecords: 0,
      rejectedRecords: 0,
      issues: issues.length
        ? issues
        : [{ stage: "persist", message: "Nenhum registro válido para importar." }],
    };
  }

  const ownerId = await requireOwnerId();
  const receipt = await tiktokPromotionsPersistence.persist(records, batch, ownerId);
  revalidatePath(IMPORTS_PATH);
  return receipt;
}

/**
 * Ponto único que a UI chama para confirmar o "Importar" — despacha pela
 * extensão do arquivo, mesma decisão que `previewImportAction` já toma para
 * a Detection Preview. `useImportSession` chama só esta função; nunca as
 * duas de cima diretamente, para não precisar saber qual plataforma está em
 * jogo (o `session/validation.ts`, checagem "persistence", já garante que só
 * chegam aqui arquivos de plataformas com persistência implementada).
 *
 * Lê o arquivo **uma única vez** e reutiliza o mesmo payload para o preview
 * e para a persistência — evita reler o `File` de `FormData`, que em runtime
 * de Server Actions pode esgotar o stream e travar a UI em "Importando...".
 */
export async function confirmImportAction(formData: FormData): Promise<PersistenceReceipt> {
  const file = getRequiredFile(formData);
  const descriptor = buildFileDescriptor(file);
  const payload = await readImportPayload(file);

  if (payload.kind === "xlsx") {
    return persistInstagramAudienceImport(file, payload.buffer);
  }

  const preview = await previewImportFile({ file: descriptor, content: payload.content });

  if (preview.status === "ready" && preview.platform === "youtube") {
    return persistYouTubeImport(file, payload.content);
  }

  if (preview.status === "ready" && dispatchTikTokImport(preview) === "tiktok_promotions") {
    return persistTikTokPromotionsImport(file, payload.content);
  }

  return unsupportedImportReceipt();
}
