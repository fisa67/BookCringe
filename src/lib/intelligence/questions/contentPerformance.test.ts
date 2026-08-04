import { describe, expect, it } from "vitest";
import {
  audienceAcquisitionContentQuestion,
  engagementFormatQuestion,
  growthThemeQuestion,
  retentionContentQuestion,
} from "@/lib/intelligence/questions/contentPerformance";
import type {
  IntelligenceContentRecord,
  IntelligenceDatasetRecord,
  IntelligenceMetricRecord,
} from "@/lib/types/intelligence";
import type { CmsBookRecord } from "@/lib/types/cms";

const NOW = new Date("2026-08-04T12:00:00.000Z");
const YOUTUBE: IntelligenceDatasetRecord = {
  id: "youtube-1",
  platform: "youtube",
  name: "YouTube Studio — Desempenho de vídeos",
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
};
const INSTAGRAM: IntelligenceDatasetRecord = {
  id: "instagram-1",
  platform: "instagram",
  name: "Instagram — Audiência",
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
};
const BOOK: CmsBookRecord = {
  id: "book-1",
  slug: "tema",
  title: "Tema Forte",
  author: "Autor",
  genres: [],
  metadata: {},
  created_at: NOW.toISOString(),
  updated_at: NOW.toISOString(),
};

function content(id: string, title: string, bookId?: string): IntelligenceContentRecord {
  return {
    id,
    dataset_id: YOUTUBE.id,
    title,
    book_id: bookId,
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
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
    measured_at: NOW.toISOString(),
    created_at: NOW.toISOString(),
  };
}

describe("Content Performance Questions", () => {
  it("answers the four content↔audience questions from evidence", () => {
    const context = {
      now: NOW,
      datasets: [YOUTUBE, INSTAGRAM],
      contents: [content("c1", "A", BOOK.id), content("c2", "B")],
      metrics: [
        metric("1", "c1", YOUTUBE.id, "views", 1000),
        metric("2", "c1", YOUTUBE.id, "watchTimeHours", 50),
        metric("3", "c1", YOUTUBE.id, "subscribers", 30),
        metric("4", "c2", YOUTUBE.id, "views", 4000),
        metric("5", "c2", YOUTUBE.id, "watchTimeHours", 8),
        metric("6", "c2", YOUTUBE.id, "subscribers", 5),
        metric("7", undefined, INSTAGRAM.id, "followersDelta", 90),
        metric("8", undefined, INSTAGRAM.id, "activeFollowers", 700),
      ],
      books: [BOOK],
    };

    expect(growthThemeQuestion.answer(context).data).toMatchObject({
      theme: "Tema Forte",
      confidence: "high",
    });
    expect(engagementFormatQuestion.answer(context).data?.format).toBeTruthy();
    expect(audienceAcquisitionContentQuestion.answer(context).data).toMatchObject({
      contentId: "c1",
      confidence: "high",
    });
    expect(retentionContentQuestion.answer(context).data).toMatchObject({
      contentId: "c1",
      confidence: "high",
    });
  });

  it("returns no answer when evidence is missing", () => {
    const empty = {
      now: NOW,
      datasets: [],
      contents: [],
      metrics: [],
      books: [],
    };

    expect(growthThemeQuestion.answer(empty).hasAnswer).toBe(false);
    expect(engagementFormatQuestion.answer(empty).hasAnswer).toBe(false);
    expect(audienceAcquisitionContentQuestion.answer(empty).hasAnswer).toBe(false);
    expect(retentionContentQuestion.answer(empty).hasAnswer).toBe(false);
  });
});
