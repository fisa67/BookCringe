const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const SAFE_MEDIA_PROTOCOLS = new Set(["http:", "https:"]);

function getProtocol(value: string): string | null {
  try {
    return new URL(value).protocol.toLowerCase();
  } catch {
    return null;
  }
}

export function isSafeNewsletterLink(value: string): boolean {
  const protocol = getProtocol(value.trim());
  return protocol !== null && SAFE_LINK_PROTOCOLS.has(protocol);
}

export function isSafeNewsletterMediaUrl(value: string): boolean {
  const protocol = getProtocol(value.trim());
  return protocol !== null && SAFE_MEDIA_PROTOCOLS.has(protocol);
}
