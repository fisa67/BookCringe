import type { Metadata } from "next";
import { IntelligenceChat } from "@/components/admin/intelligence/IntelligenceChat";

export const metadata: Metadata = {
  title: "Chat — Intelligence — Admin BookCringe",
};

/**
 * Intelligence Chat (Sprint 23) — camada de linguagem natural sobre
 * Questions, Insights e Decisions já existentes. Não cria nenhuma
 * inteligência nova: só traduz o que os três módulos já calculam em uma
 * resposta amigável, em português, via LLM (`intelligenceChatService.ts`).
 */
export default function IntelligenceChatPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Chat</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Chat de Intelligence</h2>
        <p className="mt-4 max-w-2xl text-slate-300">
          Faça uma pergunta em português sobre a audiência, os conteúdos ou as campanhas.
          O Chat consulta apenas as Questions, Insights e Decisions que o Intelligence já calcula —{" "}
          <span className="text-slate-100">nunca os dados brutos importados</span> — e usa um LLM só para
          traduzir esse resultado em uma resposta natural.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <IntelligenceChat />
      </section>
    </div>
  );
}
