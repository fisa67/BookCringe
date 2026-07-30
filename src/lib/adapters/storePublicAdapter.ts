import {
  getPublicStoreCollections,
  type CmsStoreCollectionWithProducts,
} from "@/lib/services/storeService";

function isSafeMediaUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function getPublicStoreCollectionsSafe(): Promise<CmsStoreCollectionWithProducts[]> {
  const collections = await getPublicStoreCollections();

  return collections.map((collection) => ({
    ...collection,
    products: collection.products.filter(
      (product) => product.is_active && isSafeMediaUrl(product.image_url)
    ),
  }));
}
