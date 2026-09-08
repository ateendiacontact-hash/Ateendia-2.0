// Dynamic SaaS & Tenant URL and Domain Resolution Utilities

export function slugify(text: string): string {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric with -
    .replace(/^-+|-+$/g, '')         // trim leading/trailing -
    || 'crm';
}

export function getSaasBaseDomain(crmName?: string, customDomain?: string): string {
  if (customDomain && customDomain.trim()) {
    return customDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
  }
  const raw = (crmName || 'ateendia-crm').trim();
  // If crmName already looks like a domain (e.g. ateendia-crm.cloud)
  if (raw.includes('.')) {
    return raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '').trim();
  }
  const brandSlug = slugify(raw.replace(/\b(saas|cloud|crm|v3|v2|v1|platform|inc|llc)\b/gi, '').trim() || raw);
  return `${brandSlug}-crm.cloud`;
}

export function getSaasPublicUrl(crmName?: string, customPublicUrl?: string, customDomain?: string): string {
  if (customPublicUrl && customPublicUrl.trim() !== '') {
    return customPublicUrl.startsWith('http') ? customPublicUrl : `https://${customPublicUrl}`;
  }
  const baseDomain = getSaasBaseDomain(crmName, customDomain);
  return `https://${baseDomain}`;
}

export function getTenantSubdomain(subdomain?: string, tenantName?: string, tenantId?: string): string {
  if (subdomain && subdomain.trim()) {
    return slugify(subdomain);
  }
  if (tenantName && tenantName.trim()) {
    return slugify(tenantName);
  }
  return slugify((tenantId || 'agencia').replace('tenant-', ''));
}

export function getTenantPublicUrl(
  tenant: { subdomain?: string; name?: string; id?: string; customDomain?: string },
  crmNameOrConfig?: string | { crmName?: string; domainName?: string }
): string {
  if (tenant.customDomain && tenant.customDomain.trim()) {
    return tenant.customDomain.startsWith('http') ? tenant.customDomain : `https://${tenant.customDomain}`;
  }
  const sub = getTenantSubdomain(tenant.subdomain, tenant.name, tenant.id);
  const crmName = typeof crmNameOrConfig === 'object' ? crmNameOrConfig?.crmName : crmNameOrConfig;
  const customDomain = typeof crmNameOrConfig === 'object' ? crmNameOrConfig?.domainName : undefined;
  const baseDomain = getSaasBaseDomain(crmName, customDomain);
  return `https://${sub}.${baseDomain}`;
}

export function getTenantWebhookUrl(tenantId: string, crmName?: string): string {
  const baseDomain = getSaasBaseDomain(crmName);
  return `https://api.${baseDomain}/v1/webhook/${tenantId}`;
}

export function getTenantPBXExtension(userExtension: string, tenantSubdomain?: string): string {
  const cleanSub = slugify(tenantSubdomain || 'ext');
  return `${cleanSub}-${userExtension || '101'}`;
}
