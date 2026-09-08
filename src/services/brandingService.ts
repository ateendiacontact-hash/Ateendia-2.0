import { apiClient, ApiResponse } from './apiClient';
import { TenantBranding, TenantLandingConfig } from '../types';

const BRANDING_ENDPOINT = 'branding';
const LANDING_ENDPOINT = 'branding/landing';

export interface UpdateBrandingData {
  name?: string;
  legalName?: string;
  taxId?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  currency?: string;
  language?: string;
  categories?: string[];
  customDomain?: string;
  subdomain?: string;
  tenantId: string;
}

export const brandingService = {
  async getBranding(): Promise<ApiResponse<TenantBranding>> {
    return apiClient.get<TenantBranding>(BRANDING_ENDPOINT);
  },

  async updateBranding(data: UpdateBrandingData): Promise<ApiResponse<TenantBranding>> {
    return apiClient.patch<TenantBranding>(BRANDING_ENDPOINT, data);
  },

  async uploadLogo(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${apiClient.getConfig().baseUrl || '/api'}${BRANDING_ENDPOINT}/logo`, {
      method: 'POST',
      headers: apiClient.getConfig().apiKey ? { 'Authorization': `Bearer ${apiClient.getConfig().apiKey}` } : {},
      body: formData,
    });
    
    const result = await response.json();
    return response.ok 
      ? { success: true, data: result }
      : { success: false, error: result.message };
  },

  async getLandingConfig(): Promise<ApiResponse<TenantLandingConfig>> {
    return apiClient.get<TenantLandingConfig>(LANDING_ENDPOINT);
  },

  async updateLandingConfig(config: Partial<TenantLandingConfig>): Promise<ApiResponse<TenantLandingConfig>> {
    return apiClient.patch<TenantLandingConfig>(LANDING_ENDPOINT, config);
  },

  async publishLanding(): Promise<ApiResponse<{ url: string }>> {
    return apiClient.post(`${LANDING_ENDPOINT}/publish`, {});
  },

  async unpublishLanding(): Promise<ApiResponse<void>> {
    return apiClient.post(`${LANDING_ENDPOINT}/unpublish`, {});
  },

  async previewLanding(): Promise<ApiResponse<{ html: string }>> {
    return apiClient.get(`${LANDING_ENDPOINT}/preview`);
  },

  subscribeBranding(callback: (branding: TenantBranding) => void) {
    return apiClient.subscribe(BRANDING_ENDPOINT, callback);
  },

  subscribeLanding(callback: (config: TenantLandingConfig) => void) {
    return apiClient.subscribe(LANDING_ENDPOINT, callback);
  },
};

export default brandingService;