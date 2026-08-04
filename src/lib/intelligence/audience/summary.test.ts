import { describe, expect, it } from "vitest";
import { buildAudienceDatasetSummaries } from "@/lib/intelligence/audience/summary";
import type {
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";

const DATASET: IntelligenceDatasetRecord = {
  id: "instagram-audience",
  platform: "instagram",
  name: "Instagram — Audiência",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

function activityMetric(params: {
  id: string;
  importId: string;
  value: number;
  measuredAt: string;
  createdAt: string;
}): IntelligenceMetricRecord {
  return {
    id: params.id,
    dataset_id: DATASET.id,
    import_id: params.importId,
    key: "activeFollowers",
    value: params.value,
    unit: "count",
    measured_at: params.measuredAt,
    created_at: params.createdAt,
  };
}

describe("buildAudienceDatasetSummaries — activityPeak", () => {
  it("substitui o valor antigo quando o mesmo horário é reimportado com correção menor", () => {
    const metrics = [
      activityMetric({
        id: "old-20h",
        importId: "import-old",
        value: 920,
        measuredAt: "2026-08-03T20:00:00.000Z",
        createdAt: "2026-08-04T10:00:00.000Z",
      }),
      activityMetric({
        id: "corrected-20h",
        importId: "import-new",
        value: 700,
        measuredAt: "2026-08-03T20:00:00.000Z",
        createdAt: "2026-08-05T10:00:00.000Z",
      }),
      activityMetric({
        id: "new-18h",
        importId: "import-new",
        value: 800,
        measuredAt: "2026-08-03T18:00:00.000Z",
        createdAt: "2026-08-05T10:00:00.000Z",
      }),
    ];

    const [summary] = buildAudienceDatasetSummaries([DATASET], metrics);

    expect(summary.activityPeak).toEqual({
      value: 800,
      measuredAt: "2026-08-03T18:00:00.000Z",
    });
  });
});
