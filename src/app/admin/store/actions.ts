"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import {
  createStoreCollection,
  createStoreProduct,
  deleteStoreCollection,
  deleteStoreProduct,
  getStoreCollectionById,
  getStoreProducts,
  syncStoreCollectionTotalQuantity,
  updateStoreCollection,
  updateStoreProduct,
} from "@/lib/services/storeService";
import {
  storeCollectionFormDataToInput,
  storeCollectionFormSchema,
  storeProductFormDataToInput,
  storeProductFormSchema,
} from "@/lib/validations/store";
import { formatValidationErrors } from "@/lib/validations/forms";

function firstErrorMessage(error: ZodError): string {
  return Object.values(formatValidationErrors(error))[0] ?? "Dados inválidos.";
}

function revalidateStorePaths(collectionId?: string) {
  revalidatePath("/admin/store");
  revalidatePath("/bookcringe-store");
  if (collectionId) revalidatePath(`/admin/store/${collectionId}`);
}

export async function createStoreCollectionAction(formData: FormData): Promise<void> {
  const parsed = storeCollectionFormSchema.safeParse(storeCollectionFormDataToInput(formData));

  if (!parsed.success) {
    redirect(`/admin/store/new?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`);
  }

  const created = await createStoreCollection({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    is_active: parsed.data.is_active,
  });

  if (!created) {
    redirect(`/admin/store/new?error=${encodeURIComponent("Não foi possível criar a coleção.")}`);
  }

  revalidateStorePaths(created.id);
  redirect(`/admin/store/${created.id}`);
}

export async function updateStoreCollectionAction(
  collectionId: string,
  formData: FormData
): Promise<void> {
  const parsed = storeCollectionFormSchema.safeParse(storeCollectionFormDataToInput(formData));

  if (!parsed.success) {
    redirect(
      `/admin/store/${collectionId}/edit?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`
    );
  }

  const updated = await updateStoreCollection({
    id: collectionId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    is_active: parsed.data.is_active,
  });

  if (!updated) {
    redirect(`/admin/store/${collectionId}/edit?error=${encodeURIComponent("Não foi possível salvar a coleção.")}`);
  }

  revalidateStorePaths(collectionId);
  redirect(`/admin/store/${collectionId}`);
}

export async function deleteStoreCollectionAction(collectionId: string): Promise<void> {
  const deleted = await deleteStoreCollection(collectionId);
  if (!deleted) {
    redirect(
      `/admin/store?error=${encodeURIComponent(
        "Não foi possível excluir a coleção. Verifique se ela possui interesses registrados."
      )}`
    );
  }
  revalidateStorePaths();
  redirect("/admin/store");
}

export async function createStoreProductAction(
  collectionId: string,
  formData: FormData
): Promise<void> {
  const parsed = storeProductFormSchema.safeParse(storeProductFormDataToInput(formData));

  if (!parsed.success) {
    redirect(
      `/admin/store/${collectionId}/products/new?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`
    );
  }

  const collection = await getStoreCollectionById(collectionId);
  if (!collection) {
    redirect(`/admin/store?error=${encodeURIComponent("Coleção não encontrada.")}`);
  }

  let position = parsed.data.position;
  if (position === undefined) {
    const products = await getStoreProducts(collectionId);
    position = products && products.length > 0 ? Math.max(...products.map((item) => item.position)) + 1 : 0;
  }

  const created = await createStoreProduct({
    collection_id: collectionId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    image_url: parsed.data.image_url,
    price: parsed.data.price,
    quantity: parsed.data.quantity,
    is_active: parsed.data.is_active,
    crew_exclusive: parsed.data.crew_exclusive,
    position,
  });

  if (!created) {
    redirect(
      `/admin/store/${collectionId}/products/new?error=${encodeURIComponent("Não foi possível criar o produto.")}`
    );
  }

  await syncStoreCollectionTotalQuantity(collectionId);
  revalidateStorePaths(collectionId);
  redirect(`/admin/store/${collectionId}`);
}

export async function updateStoreProductAction(
  collectionId: string,
  productId: string,
  formData: FormData
): Promise<void> {
  const parsed = storeProductFormSchema.safeParse(storeProductFormDataToInput(formData));

  if (!parsed.success) {
    redirect(
      `/admin/store/${collectionId}/products/${productId}/edit?error=${encodeURIComponent(firstErrorMessage(parsed.error))}`
    );
  }

  const updated = await updateStoreProduct(collectionId, {
    id: productId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    image_url: parsed.data.image_url,
    price: parsed.data.price,
    quantity: parsed.data.quantity,
    is_active: parsed.data.is_active,
    crew_exclusive: parsed.data.crew_exclusive,
    ...(parsed.data.position === undefined ? {} : { position: parsed.data.position }),
  });

  if (!updated) {
    redirect(
      `/admin/store/${collectionId}/products/${productId}/edit?error=${encodeURIComponent("Não foi possível salvar o produto.")}`
    );
  }

  await syncStoreCollectionTotalQuantity(collectionId);
  revalidateStorePaths(collectionId);
  redirect(`/admin/store/${collectionId}`);
}

export async function deleteStoreProductAction(
  collectionId: string,
  productId: string
): Promise<void> {
  const deleted = await deleteStoreProduct(collectionId, productId);
  if (!deleted) {
    redirect(
      `/admin/store/${collectionId}?error=${encodeURIComponent(
        "Não foi possível excluir o produto. Verifique se ele possui interesses registrados."
      )}`
    );
  }
  await syncStoreCollectionTotalQuantity(collectionId);
  revalidateStorePaths(collectionId);
  redirect(`/admin/store/${collectionId}`);
}
