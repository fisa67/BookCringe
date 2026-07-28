import { describe, expect, it } from "vitest";
import { getSubscriberSocialProofCopy } from "./subscriberSocialProof";

/**
 * Cobre as faixas de `getSubscriberSocialProofCopy`, com foco na fronteira
 * de 10 inscritos (caso investigado: 12 inscritos totais no CMS, prova
 * social não aparecia em `/crew-literario`). O piso "-1" é proposital (ver
 * comentário da função) — nunca mostra o valor exato, só um piso seguro.
 */
describe("getSubscriberSocialProofCopy", () => {
  it("não mostra nada abaixo de 10 inscritos", () => {
    expect(getSubscriberSocialProofCopy(0)).toBeNull();
    expect(getSubscriberSocialProofCopy(9)).toBeNull();
  });

  it("mostra a partir de 10 inscritos, com piso count - 1", () => {
    expect(getSubscriberSocialProofCopy(10)).toBe("Junte-se a mais de 9 leitores do Crew Literário");
    expect(getSubscriberSocialProofCopy(12)).toBe("Junte-se a mais de 11 leitores do Crew Literário");
  });

  it("muda o tom a partir de 100 inscritos", () => {
    expect(getSubscriberSocialProofCopy(150)).toBe("Mais de 149 leitores já fazem parte do Crew Literário");
  });

  it("arredonda para a centena a partir de 500", () => {
    expect(getSubscriberSocialProofCopy(733)).toBe("Mais de 700 leitores já fazem parte do Crew Literário");
  });

  it("arredonda para o milhar a partir de 1000, formatado em pt-BR", () => {
    expect(getSubscriberSocialProofCopy(2480)).toBe("Mais de 2.000 leitores já fazem parte do Crew Literário");
  });
});
