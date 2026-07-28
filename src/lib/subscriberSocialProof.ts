/**
 * Prova social "inteligente" do Crew Literário — nunca mostra a quantidade
 * exata de inscritos, só um piso seguro (sempre `<=` o valor real), para
 * nunca contradizer a realidade e evitar o efeito negativo de números
 * baixos ("só 4 pessoas entraram" desmotiva mais do que não mostrar nada).
 *
 * Faixas (por `getSubscriberSocialProofCopy`):
 *   -    0–9: não mostra nada (`null`) — abaixo do mínimo que soa como
 *        prova social de verdade.
 *   -   10–499: piso = `total - 1` (a única forma de nunca superestimar
 *        sem arredondar tanto que a faixa vire imprecisa); tom muda de
 *        "Junte-se a mais de X" (10–99, ainda é convite) para "Mais de X já
 *        fazem parte" (100–499, já é afirmação de comunidade estabelecida).
 *   -  500–999: piso arredondado para a centena abaixo (ex.: 733 → 700) —
 *        nessa escala, granularidade de 1 em 1 não importa mais e um número
 *        redondo soa mais afirmativo.
 *   - 1000+: piso arredondado para o milhar abaixo (ex.: 2.480 → 2.000),
 *        formatado com separador de milhar (pt-BR).
 */
export function getSubscriberSocialProofCopy(count: number): string | null {
  if (!Number.isFinite(count) || count < 10) {
    return null;
  }

  if (count < 100) {
    return `Junte-se a mais de ${count - 1} leitores do Crew Literário`;
  }

  if (count < 500) {
    return `Mais de ${count - 1} leitores já fazem parte do Crew Literário`;
  }

  const floorTo = count < 1000 ? 100 : 1000;
  const floored = Math.floor(count / floorTo) * floorTo;
  return `Mais de ${floored.toLocaleString("pt-BR")} leitores já fazem parte do Crew Literário`;
}
