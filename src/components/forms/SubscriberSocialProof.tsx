import { getSubscribersCount } from "@/lib/services/subscriberService";
import { getSubscriberSocialProofCopy } from "@/lib/subscriberSocialProof";

interface SubscriberSocialProofProps {
  className?: string;
}

/**
 * Prova social do Crew Literário — busca o total de inscritos (todas as
 * origens, ver `subscriberService.getSubscribersCount`) e renderiza a copy
 * já "arredondada para baixo" de `getSubscriberSocialProofCopy`. Server
 * component (sem estado/interação) — não bloqueia o form (`NewsletterForm`)
 * de renderizar caso a contagem falhe: nesse caso, ou com poucos inscritos
 * (<10), simplesmente não renderiza nada.
 */
export async function SubscriberSocialProof({ className }: SubscriberSocialProofProps) {
  const count = await getSubscribersCount();
  const copy = typeof count === "number" ? getSubscriberSocialProofCopy(count) : null;

  if (!copy) {
    return null;
  }

  return (
    <p className={`text-sm font-medium text-[var(--bc-muted)] ${className ?? ""}`}>👥 {copy}</p>
  );
}
