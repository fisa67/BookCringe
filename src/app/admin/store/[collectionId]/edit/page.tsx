import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreCollectionForm } from "@/components/admin/store/StoreCollectionForm";
import { updateStoreCollectionAction } from "@/app/admin/store/actions";
import { getStoreCollectionById } from "@/lib/services/storeService";

export const metadata: Metadata = {
  title: "Editar coleção — BookCringe Store",
};

interface EditStoreCollectionPageProps {
  params: Promise<{ collectionId: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditStoreCollectionPage({
  params,
  searchParams,
}: EditStoreCollectionPageProps) {
  const [{ collectionId }, { error }] = await Promise.all([params, searchParams]);
  const collection = await getStoreCollectionById(collectionId);

  if (!collection) notFound();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">BookCringe Store</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Editar coleção</h1>
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <StoreCollectionForm
          action={updateStoreCollectionAction.bind(null, collection.id)}
          collection={collection}
          cancelHref={`/admin/store/${collection.id}`}
          errorMessage={error}
        />
      </div>
    </div>
  );
}
