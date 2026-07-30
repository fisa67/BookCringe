import type { CmsStoreCollectionRecord, CmsStoreProductRecord } from "@/lib/types/cms";
import { supabaseAdminClient } from "@/lib/supabase/client";

const COLLECTIONS_TABLE = "store_collections" as const;
const PRODUCTS_TABLE = "store_products" as const;

export interface CmsStoreCollectionWithProducts extends CmsStoreCollectionRecord {
  products: CmsStoreProductRecord[];
}

type CollectionPayload = Omit<
  CmsStoreCollectionRecord,
  "id" | "created_at" | "updated_at" | "total_quantity"
>;
type ProductPayload = Omit<CmsStoreProductRecord, "id" | "created_at" | "updated_at">;

function now() {
  return new Date().toISOString();
}

export async function getStoreCollections(): Promise<CmsStoreCollectionRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(COLLECTIONS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[storeService] getStoreCollections error", error);
    return null;
  }

  return data;
}

export async function getStoreCollectionById(id: string): Promise<CmsStoreCollectionRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(COLLECTIONS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[storeService] getStoreCollectionById error", error);
    return null;
  }

  return data;
}

export async function getStoreProducts(collectionId: string): Promise<CmsStoreProductRecord[] | null> {
  const { data, error } = await supabaseAdminClient
    .from(PRODUCTS_TABLE)
    .select("*")
    .eq("collection_id", collectionId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[storeService] getStoreProducts error", error);
    return null;
  }

  return data;
}

export async function getStoreProductById(
  collectionId: string,
  productId: string
): Promise<CmsStoreProductRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(PRODUCTS_TABLE)
    .select("*")
    .eq("id", productId)
    .eq("collection_id", collectionId)
    .maybeSingle();

  if (error) {
    console.error("[storeService] getStoreProductById error", error);
    return null;
  }

  return data;
}

export async function getPublicStoreCollections(): Promise<CmsStoreCollectionWithProducts[]> {
  const collections = await getStoreCollections();
  if (!collections) return [];

  const activeCollections = collections.filter((collection) => collection.is_active);
  const withProducts = await Promise.all(
    activeCollections.map(async (collection) => ({
      ...collection,
      products: (await getStoreProducts(collection.id)) ?? [],
    }))
  );

  return withProducts;
}

export async function createStoreCollection(
  payload: CollectionPayload
): Promise<CmsStoreCollectionRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(COLLECTIONS_TABLE)
    .insert({ ...payload, total_quantity: 0 })
    .select()
    .single();

  if (error) {
    console.error("[storeService] createStoreCollection error", error);
    return null;
  }

  return data;
}

export async function updateStoreCollection(
  payload: Partial<CollectionPayload> & { id: string }
): Promise<CmsStoreCollectionRecord | null> {
  const { id, ...changes } = payload;
  const { data, error } = await supabaseAdminClient
    .from(COLLECTIONS_TABLE)
    .update({ ...changes, updated_at: now() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[storeService] updateStoreCollection error", error);
    return null;
  }

  return data;
}

export async function deleteStoreCollection(id: string): Promise<boolean> {
  const { error } = await supabaseAdminClient.from(COLLECTIONS_TABLE).delete().eq("id", id);

  if (error) {
    console.error("[storeService] deleteStoreCollection error", error);
    return false;
  }

  return true;
}

export async function createStoreProduct(
  payload: ProductPayload
): Promise<CmsStoreProductRecord | null> {
  const { data, error } = await supabaseAdminClient
    .from(PRODUCTS_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("[storeService] createStoreProduct error", error);
    return null;
  }

  return data;
}

export async function updateStoreProduct(
  collectionId: string,
  payload: Partial<ProductPayload> & { id: string }
): Promise<CmsStoreProductRecord | null> {
  const { id, ...changes } = payload;
  const { data, error } = await supabaseAdminClient
    .from(PRODUCTS_TABLE)
    .update({ ...changes, updated_at: now() })
    .eq("id", id)
    .eq("collection_id", collectionId)
    .select()
    .single();

  if (error) {
    console.error("[storeService] updateStoreProduct error", error);
    return null;
  }

  return data;
}

export async function deleteStoreProduct(collectionId: string, id: string): Promise<boolean> {
  const { error } = await supabaseAdminClient
    .from(PRODUCTS_TABLE)
    .delete()
    .eq("id", id)
    .eq("collection_id", collectionId);

  if (error) {
    console.error("[storeService] deleteStoreProduct error", error);
    return false;
  }

  return true;
}

/**
 * Mantém o total da coleção derivado das quantidades dos produtos, para que
 * o CMS não tenha dois valores de estoque para administrar.
 */
export async function syncStoreCollectionTotalQuantity(collectionId: string): Promise<boolean> {
  const products = await getStoreProducts(collectionId);
  if (!products) return false;

  const totalQuantity = products.reduce((total, product) => total + product.quantity, 0);
  const { error } = await supabaseAdminClient
    .from(COLLECTIONS_TABLE)
    .update({ total_quantity: totalQuantity, updated_at: now() })
    .eq("id", collectionId);

  if (error) {
    console.error("[storeService] syncStoreCollectionTotalQuantity error", error);
    return false;
  }

  return true;
}
