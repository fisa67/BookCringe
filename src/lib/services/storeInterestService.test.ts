import { describe, expect, it } from "vitest";
import {
  buildStoreInterestGroups,
  countStoreInterestsLast30Days,
  type StoreInterestListItem,
} from "./storeInterestService";

function interest(
  id: string,
  collectionId: string,
  collectionName: string,
  productId: string,
  productName: string
): StoreInterestListItem {
  return {
    id,
    collection_id: collectionId,
    product_id: productId,
    collectionName,
    productName,
    name: "Leitora",
    email: `${id}@example.com`,
    message: null,
    created_at: "2026-07-30T12:00:00.000Z",
  };
}

describe("buildStoreInterestGroups", () => {
  it("agrupa e ordena interesses por coleção e produto", () => {
    const result = buildStoreInterestGroups([
      interest("1", "collection-1", "Crew Collection #001", "product-shirt", "Camiseta"),
      interest("2", "collection-1", "Crew Collection #001", "product-shirt", "Camiseta"),
      interest("3", "collection-1", "Crew Collection #001", "product-marker", "Marcador"),
      interest("4", "collection-2", "Crew Collection #002", "product-hat", "Boné"),
    ]);

    expect(result.collectionGroups[0]).toMatchObject({
      name: "Crew Collection #001",
      count: 3,
    });
    expect(result.collectionGroups[0].products).toMatchObject([
      { name: "Camiseta", count: 2 },
      { name: "Marcador", count: 1 },
    ]);
    expect(result.productGroups[0]).toMatchObject({
      name: "Camiseta",
      count: 2,
    });
  });

  it("conta os interesses dos últimos 30 dias", () => {
    const now = new Date("2026-07-30T12:00:00.000Z");
    const recent = interest("recent", "collection-1", "Coleção", "product-1", "Produto");
    const boundary = {
      ...recent,
      id: "boundary",
      created_at: "2026-06-30T12:00:00.000Z",
    };
    const old = {
      ...recent,
      id: "old",
      created_at: "2026-06-30T11:59:59.999Z",
    };

    expect(countStoreInterestsLast30Days([recent, boundary, old], now)).toBe(2);
  });
});
