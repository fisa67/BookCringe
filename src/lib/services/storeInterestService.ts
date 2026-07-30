import type {
  CmsStoreCollectionRecord,
  CmsStoreInterestRecord,
  CmsStoreProductRecord,
} from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const TABLE = "store_interests" as const;
const COLLECTIONS_TABLE = "store_collections" as const;
const PRODUCTS_TABLE = "store_products" as const;

export interface CreateStoreInterestInput {
  collection_id: string;
  product_id: string;
  name: string;
  email: string;
  message: string | null;
}

export async function createStoreInterest(
  payload: CreateStoreInterestInput
): Promise<CmsStoreInterestRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[storeInterestService] createStoreInterest error", error);
    return null;
  }

  return data;
}

export interface StoreInterestFilters {
  collectionId?: string;
  productId?: string;
  from?: string;
  to?: string;
}

export interface StoreInterestListItem extends CmsStoreInterestRecord {
  collectionName: string;
  productName: string;
}

export interface StoreInterestProductGroup {
  id: string;
  name: string;
  collectionId: string;
  collectionName: string;
  count: number;
}

export interface StoreInterestCollectionGroup {
  id: string;
  name: string;
  count: number;
  products: StoreInterestProductGroup[];
}

export interface StoreInterestDashboard {
  totalCount: number;
  last30DaysCount: number;
  topCollection: StoreInterestCollectionGroup | null;
  topProduct: StoreInterestProductGroup | null;
  collectionGroups: StoreInterestCollectionGroup[];
  productGroups: StoreInterestProductGroup[];
  interests: StoreInterestListItem[];
  collections: CmsStoreCollectionRecord[];
  products: CmsStoreProductRecord[];
}

function validDateOnly(value?: string): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : value;
}

function validUuid(value?: string): string | undefined {
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : undefined;
}

function nextDay(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

async function getInterestContext(
  filters: StoreInterestFilters
): Promise<{
  rows: CmsStoreInterestRecord[];
  collections: CmsStoreCollectionRecord[];
  products: CmsStoreProductRecord[];
} | null> {
  let query = supabaseAdminClient
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.collectionId) {
    const collectionId = validUuid(filters.collectionId);
    if (collectionId) query = query.eq("collection_id", collectionId);
  }

  if (filters.productId) {
    const productId = validUuid(filters.productId);
    if (productId) query = query.eq("product_id", productId);
  }

  const from = validDateOnly(filters.from);
  if (from) {
    query = query.gte("created_at", `${from}T00:00:00.000Z`);
  }

  const to = validDateOnly(filters.to);
  if (to) {
    query = query.lt("created_at", nextDay(to));
  }

  const [interestResult, collectionsResult, productsResult] = await Promise.all([
    query,
    supabaseAdminClient
      .from(COLLECTIONS_TABLE)
      .select("*")
      .order("name", { ascending: true }),
    supabaseAdminClient
      .from(PRODUCTS_TABLE)
      .select("*")
      .order("name", { ascending: true }),
  ]);

  if (interestResult.error || collectionsResult.error || productsResult.error) {
    console.error(
      "[storeInterestService] getInterestContext error",
      interestResult.error ?? collectionsResult.error ?? productsResult.error
    );
    return null;
  }

  return {
    rows: interestResult.data,
    collections: collectionsResult.data,
    products: productsResult.data,
  };
}

function addNames(
  rows: CmsStoreInterestRecord[],
  collections: CmsStoreCollectionRecord[],
  products: CmsStoreProductRecord[]
): StoreInterestListItem[] {
  const collectionNames = new Map(collections.map((collection) => [collection.id, collection.name]));
  const productNames = new Map(products.map((product) => [product.id, product.name]));

  return rows.map((row) => ({
    ...row,
    collectionName: collectionNames.get(row.collection_id) ?? "Coleção não encontrada",
    productName: productNames.get(row.product_id) ?? "Produto não encontrado",
  }));
}

export async function getStoreInterests(
  filters: StoreInterestFilters = {}
): Promise<StoreInterestListItem[] | null> {
  const context = await getInterestContext(filters);
  if (!context) return null;

  return addNames(context.rows, context.collections, context.products);
}

export function countStoreInterestsLast30Days(
  interests: Array<Pick<CmsStoreInterestRecord, "created_at">>,
  now = new Date()
): number {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 30);
  const startTime = start.getTime();

  return interests.filter((interest) => {
    const createdAt = new Date(interest.created_at).getTime();
    return !Number.isNaN(createdAt) && createdAt >= startTime;
  }).length;
}

export function buildStoreInterestGroups(interests: StoreInterestListItem[]): {
  collectionGroups: StoreInterestCollectionGroup[];
  productGroups: StoreInterestProductGroup[];
} {
  const collections = new Map<
    string,
    { id: string; name: string; count: number; products: Map<string, StoreInterestProductGroup> }
  >();
  const products = new Map<string, StoreInterestProductGroup>();

  for (const interest of interests) {
    let collection = collections.get(interest.collection_id);
    if (!collection) {
      collection = {
        id: interest.collection_id,
        name: interest.collectionName,
        count: 0,
        products: new Map(),
      };
      collections.set(interest.collection_id, collection);
    }
    collection.count += 1;

    let product = products.get(interest.product_id);
    if (!product) {
      product = {
        id: interest.product_id,
        name: interest.productName,
        collectionId: interest.collection_id,
        collectionName: interest.collectionName,
        count: 0,
      };
      products.set(interest.product_id, product);
    }
    product.count += 1;

    const collectionProduct = collection.products.get(interest.product_id);
    if (collectionProduct) {
      collectionProduct.count += 1;
    } else {
      collection.products.set(interest.product_id, { ...product, count: 1 });
    }
  }

  const sortGroups = <T extends { count: number; name: string }>(groups: T[]) =>
    groups.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"));

  const productGroups = sortGroups(Array.from(products.values()));
  const collectionGroups = sortGroups(
    Array.from(collections.values()).map((collection) => ({
      id: collection.id,
      name: collection.name,
      count: collection.count,
      products: sortGroups(Array.from(collection.products.values())),
    }))
  );

  return { collectionGroups, productGroups };
}

export async function getStoreInterestDashboard(
  filters: StoreInterestFilters = {}
): Promise<StoreInterestDashboard | null> {
  const context = await getInterestContext(filters);
  if (!context) return null;

  const interests = addNames(context.rows, context.collections, context.products);
  const { collectionGroups, productGroups } = buildStoreInterestGroups(interests);
  const last30DaysCount = countStoreInterestsLast30Days(interests);

  return {
    totalCount: interests.length,
    last30DaysCount,
    topCollection: collectionGroups[0] ?? null,
    topProduct: productGroups[0] ?? null,
    collectionGroups,
    productGroups,
    interests,
    collections: context.collections,
    products: context.products,
  };
}
