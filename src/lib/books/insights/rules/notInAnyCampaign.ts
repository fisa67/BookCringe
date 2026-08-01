import type { BookInsight, BookInsightRule } from "@/lib/books/insights/types";

/**
 * "Fora de qualquer campanha": livro favorito/recomendado que nunca foi
 * incluído em uma campanha promocional.
 *
 * `CampaignSummary` (retorno de `getCampaignsContainingBook`) não carrega
 * `is_active` — checar apenas campanhas *ativas* exigiria uma consulta
 * própria. Como só existe uma campanha ativa por vez no site inteiro (ver
 * `setPromotionalCampaignActive`), "nunca esteve em nenhuma campanha" já é
 * um sinal forte de oportunidade perdida, então a regra usa esse critério
 * mais simples em vez de filtrar por campanha ativa.
 */
export const notInAnyCampaignRule: BookInsightRule = {
  id: "not-in-any-campaign",
  description: "Aponta livros favoritos/recomendados que nunca entraram em uma campanha.",
  evaluate({ book, reading, participations }): BookInsight[] {
    if (participations.campaigns.length > 0) return [];
    if (!reading?.favorite && !reading?.would_recommend) return [];

    return [
      {
        id: `not-in-any-campaign:${book.id}`,
        ruleId: "not-in-any-campaign",
        severity: "info",
        title: "Fora de qualquer campanha",
        message: "Este livro é um favorito da Curadoria, mas nunca apareceu em uma campanha promocional.",
        actionLabel: "Adicionar à campanha",
        actionHref: `/admin/campaigns?bookId=${book.id}`,
      },
    ];
  },
};
