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
