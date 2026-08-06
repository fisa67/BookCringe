import type { ImportPlatform } from "@/lib/intelligence/imports/types";
import type {
  IntelligenceDatasetRecord,
  IntelligenceImportRecord,
  IntelligenceImportRowStatus,
} from "@/lib/types/intelligence";

export interface ImportHistoryRow {
  id: string;
  platform: ImportPlatform | "unknown";
  fileName: string;
  startedAt: string;
  status: IntelligenceImportRowStatus;
  acceptedRecords: number;
  rejectedRecords: number;
}

/**
 * Monta as linhas do Histórico de Importações (`/admin/intelligence/importacoes`)
 * a partir dos Imports já persistidos e dos Datasets que os referenciam —
 * pura, sem I/O. A plataforma vem do Dataset (não do nome do arquivo), porque
 * é assim que o Dashboard já resolve `latestImport`.
 */
export function buildImportHistoryRows(
  imports: IntelligenceImportRecord[],
  datasets: IntelligenceDatasetRecord[]
): ImportHistoryRow[] {
  const datasetById = new Map(datasets.map((dataset) => [dataset.id, dataset]));

  return imports.map((entry) => ({
    id: entry.id,
    platform: datasetById.get(entry.dataset_id)?.platform ?? "unknown",
    fileName: entry.file_name,
    startedAt: entry.started_at,
    status: entry.status,
    acceptedRecords: entry.accepted_records,
    rejectedRecords: entry.rejected_records,
  }));
}
