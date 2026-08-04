import { describe, expect, it } from "vitest";
import {
  correlateContentThemesToGrowth,
  correlateContentToAcquisition,
  correlateContentToEngagement,
  correlateContentToRetention,
} from "@/lib/intelligence/contentPerformance/correlations";
import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import type { CmsBookRecord } from "@/lib/types/cms";

const YOUTUBE: IntelligenceDatasetRecord = {
  id: "youtube-1",
  platform: "youtube",
  name: "YouTube Studio — Desempenho de vídeos",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

const INSTAGRAM: IntelligenceDatasetRecord = {
  id: "instagram-1",
  platform: "instagram",
  name: "Instagram — Audiência",
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

const BOOK: CmsBookRecord = {
  id: "book-1",
  slug: "ler-mais",
  title: "Como Ler Mais",
  author: "Autor",
  genres: [],
  metadata: {},
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
};

function content(id: string, title: string, bookId?: string): IntelligenceContentRecord {
  return {
    id,
    dataset_id: YOUTUBE.id,
    title,
    book_id: bookId,
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
  };
}

function metric(
  id: string,
  contentId: string | undefined,
  datasetId: string,
  key: string,
  value: number
): IntelligenceMetricRecord {
  return {
    id,
    dataset_id: datasetId,
    import_id: "import-1",
    content_id: contentId,
    key,
    value,
    measured_at: "2026-08-01T00:00:00.000Z",
    created_at: "2026-08-01T00:00:00.000Z",
  };
}

describe("contentPerformance correlations", () => {
  it("correlates themes/growth and engagement/acquisition/retention with confidence", () => {
    const contents = [
      content("c1", "Vídeo A", BOOK.id),
      content("c2", "Vídeo B"),
    ];
    const metrics = [
      metric("m1", "c1", YOUTUBE.id, "views", 1000),
      metric("m2", "c1", YOUTUBE.id, "watchTimeHours", 80),
      metric("m3", "c1", YOUTUBE.id, "subscribers", 40),
      metric("m4", "c2", YOUTUBE.id, "views", 5000),
      metric("m5", "c2", YOUTUBE.id, "watchTimeHours", 10),
      metric("m6", "c2", YOUTUBE.id, "subscribers", 10),
      metric("m7", undefined, INSTAGRAM.id, "followersDelta", 120),
      metric("m8", undefined, INSTAGRAM.id, "activeFollowers", 900),
    ];

    const growth = correlateContentThemesToGrowth({
      datasets: [YOUTUBE, INSTAGRAM],
      contents,
      metrics,
      books: [BOOK],
    });
    expect(growth).toMatchObject({ theme: "Como Ler Mais", confidence: "high" });

    const engagement = correlateContentToEngagement({
      datasets: [YOUTUBE, INSTAGRAM],
      contents,
      metrics,
      books: [BOOK],
    });
    expect(engagement?.format).toBeTruthy();
    expect(engagement?.confidence).toBe("high");

    const acquisition = correlateContentToAcquisition({
      datasets: [YOUTUBE, INSTAGRAM],
      contents,
      metrics,
      books: [BOOK],
    });
    expect(acquisition).toMatchObject({ contentId: "c1", confidence: "high" });

    const retention = correlateContentToRetention({
      datasets: [YOUTUBE, INSTAGRAM],
      contents,
      metrics,
      books: [BOOK],
    });
    expect(retention).toMatchObject({ contentId: "c1", confidence: "high" });
  });

  it("returns low confidence or null when evidence is weak", () => {
    expect(
      correlateContentThemesToGrowth({
        datasets: [YOUTUBE],
        contents: [content("c1", "Só um")],
        metrics: [metric("m1", "c1", YOUTUBE.id, "subscribers", 5)],
      })?.confidence
    ).toBe("low");

    expect(
      correlateContentToRetention({
        datasets: [YOUTUBE],
        contents: [],
        metrics: [],
      })
    ).toBeNull();
  });
});
