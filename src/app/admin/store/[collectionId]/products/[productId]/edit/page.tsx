import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreProductForm } from "@/components/admin/store/StoreProductForm";
import { updateStoreProductAction } from "@/app/admin/store/actions";
import {
  getStoreCollectionById,
  getStoreProducts,
} from "@/lib/services/storeService";

export const metadata: Metadata = {
  title: "Editar produto — BookCringe Store",
};

interface EditStoreProductPageProps {
  params: Promise<{ collectionId: string; productId: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditStoreProductPage({
  params,
  searchParams,
}: EditStoreProductPageProps) {
  const [{ collectionId, productId }, { error }] = await Promise.all([params, searchParams]);
  const [collection, products] = await Promise.all([
    getStoreCollectionById(collectionId),
    getStoreProducts(collectionId),
  ]);
  const product = products?.find((candidate) => candidate.id === productId);

  if (!collection || !product) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{collection.name}</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Editar produto</h1>
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <StoreProductForm
          action={updateStoreProductAction.bind(null, collection.id, product.id)}
          product={product}
          cancelHref={`/admin/store/${collection.id}`}
          errorMessage={error}
        />
      </div>
    </div>
  );
}
