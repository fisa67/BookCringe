import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreProductForm } from "@/components/admin/store/StoreProductForm";
import { createStoreProductAction } from "@/app/admin/store/actions";
import { getStoreCollectionById } from "@/lib/services/storeService";

export const metadata: Metadata = {
  title: "Novo produto — BookCringe Store",
};

interface NewStoreProductPageProps {
  params: Promise<{ collectionId: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function NewStoreProductPage({
  params,
  searchParams,
}: NewStoreProductPageProps) {
  const [{ collectionId }, { error }] = await Promise.all([params, searchParams]);
  const collection = await getStoreCollectionById(collectionId);

  if (!collection) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{collection.name}</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Novo produto</h1>
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <StoreProductForm
          action={createStoreProductAction.bind(null, collection.id)}
          cancelHref={`/admin/store/${collection.id}`}
          errorMessage={error}
        />
      </div>
    </div>
  );
}
