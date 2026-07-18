export interface AffiliateProgramConfig {
  parameterName: string;
  id: string;
}

export function buildAffiliateUrl(
  baseUrl?: string | null,
  program?: AffiliateProgramConfig | null
): string | undefined {
  if (!baseUrl || !program?.id) {
    return undefined;
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set(program.parameterName, program.id);
    return url.toString();
  } catch (error) {
    console.error("[affiliateService] buildAffiliateUrl error", error);
    return undefined;
  }
}

export function buildAmazonAffiliateUrl(
  baseUrl?: string | null,
  associateId?: string | null
): string | undefined {
  return buildAffiliateUrl(baseUrl, associateId ? { parameterName: "tag", id: associateId } : null);
}

/**
 * Resolve a URL de compra pública de um livro: aplica a tag de afiliado
 * quando há `associateId` configurado (`settings.amazon_associate_id`);
 * cai para `baseUrl` cru quando não há.
 *
 * `buildAmazonAffiliateUrl` retorna `undefined` sempre que `associateId`
 * está ausente — por design (não tem tag pra aplicar). Usado direto, isso
 * apagaria o link de compra em qualquer livro enquanto o Associate ID não
 * estiver configurado. Esta função é o ponto único que todo adapter público
 * deve chamar para nunca esconder um link de compra válido só por falta de
 * tag de afiliado.
 */
export function resolveAmazonPurchaseUrl(
  baseUrl?: string | null,
  associateId?: string | null
): string | undefined {
  return buildAmazonAffiliateUrl(baseUrl, associateId) ?? baseUrl ?? undefined;
}
