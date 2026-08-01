/**
 * Similaridade de título — puro texto, sem IA nem busca semântica. Usa o
 * coeficiente de Dice sobre bigramas de caracteres: conta quantos pares de
 * letras consecutivas os dois títulos têm em comum, normalizado pelo total
 * de pares. Tolera diferença de maiúsculas/acentos/pontuação e pequena
 * variação de palavras (típico entre o título de um vídeo e o título de um
 * Livro), sem depender de nenhum serviço externo ou modelo de linguagem.
 *
 * Ver `docs/content-matching.md` para o porquê desta escolha.
 */

export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function characterBigrams(value: string): string[] {
  if (value.length < 2) return [];

  const bigrams: string[] = [];
  for (let index = 0; index < value.length - 1; index += 1) {
    bigrams.push(value.slice(index, index + 2));
  }
  return bigrams;
}

/**
 * Retorna um score de 0 (nada parecido) a 1 (idêntico após normalização).
 * `titleA`/`titleB` podem vir em qualquer capitalização/acentuação — a
 * normalização é feita aqui, o chamador não precisa se preocupar com isso.
 */
export function titleSimilarity(titleA: string, titleB: string): number {
  const normalizedA = normalizeTitle(titleA);
  const normalizedB = normalizeTitle(titleB);

  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 1;

  const bigramsA = characterBigrams(normalizedA);
  const bigramsB = characterBigrams(normalizedB);
  if (bigramsA.length === 0 || bigramsB.length === 0) return 0;

  const remainingB = new Map<string, number>();
  for (const bigram of bigramsB) {
    remainingB.set(bigram, (remainingB.get(bigram) ?? 0) + 1);
  }

  let intersectionCount = 0;
  for (const bigram of bigramsA) {
    const count = remainingB.get(bigram) ?? 0;
    if (count > 0) {
      intersectionCount += 1;
      remainingB.set(bigram, count - 1);
    }
  }

  return (2 * intersectionCount) / (bigramsA.length + bigramsB.length);
}
