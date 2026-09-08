import { TenantBranding } from '../types';

export type BackendMode = 'localStorage' | 'supabase' | 'express' | 'rest';

export interface ApiConfig {
  mode: BackendMode;
  baseUrl?: string;
  apiKey?: string;
  tenantId?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private config: ApiConfig = {
    mode: 'localStorage',
  };

  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  configure(config: Partial<ApiConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    if (this.config.tenantId) {
      headers['X-Tenant-ID'] = this.config.tenantId;
    }

    return headers;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    if (this.config.mode === 'localStorage') {
      return this.localStorageRequest<T>(method, endpoint, data);
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || `HTTP ${response.status}`,
        };
      }

      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  private localStorageRequest<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const storageKey = `atoms_cloud_crm_${this.config.tenantId || 'default'}_${endpoint.replace(/\//g, '_')}`;
          
          switch (method) {
            case 'GET':
              if (endpoint.includes('/')) {
                const id = endpoint.split('/').pop();
                const allData = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const item = allData.find((d: any) => d.id === id);
                resolve({ success: true, data: item as T });
              } else {
                const allData = JSON.parse(localStorage.getItem(storageKey) || '[]');
                resolve({ success: true, data: allData as T });
              }
              break;

            case 'POST':
              const allData = JSON.parse(localStorage.getItem(storageKey) || '[]');
              const newItem = { ...data, id: `${endpoint.split('/').pop()}-${Date.now()}`, createdAt: new Date().toISOString() };
              allData.unshift(newItem);
              localStorage.setItem(storageKey, JSON.stringify(allData));
              this.notifyListeners(endpoint, allData);
              resolve({ success: true, data: newItem as T });
              break;

            case 'PUT':
            case 'PATCH':
              const updateData = JSON.parse(localStorage.getItem(storageKey) || '[]');
              const index = updateData.findIndex((d: any) => d.id === data.id);
              if (index >= 0) {
                updateData[index] = { ...updateData[index], ...data, updatedAt: new Date().toISOString() };
                localStorage.setItem(storageKey, JSON.stringify(updateData));
                this.notifyListeners(endpoint, updateData);
                resolve({ success: true, data: updateData[index] as T });
              } else {
                resolve({ success: false, error: 'Item not found' });
              }
              break;

            case 'DELETE':
              const deleteData = JSON.parse(localStorage.getItem(storageKey) || '[]');
              const filtered = deleteData.filter((d: any) => d.id !== data.id);
              localStorage.setItem(storageKey, JSON.stringify(filtered));
              this.notifyListeners(endpoint, filtered);
              resolve({ success: true, data: null as any });
              break;
          }
        } catch (error: any) {
          resolve({ success: false, error: error.message });
        }
      }, 100);
    });
  }

  subscribe(endpoint: string, callback: (data: any) => void) {
    if (!this.listeners.has(endpoint)) {
      this.listeners.set(endpoint, new Set());
    }
    this.listeners.get(endpoint)!.add(callback);
    return () => this.listeners.get(endpoint)?.delete(callback);
  }

  private notifyListeners(endpoint: string, data: any) {
    this.listeners.get(endpoint)?.forEach((cb) => cb(data));
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data);
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data);
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data);
  }

  async delete<T>(endpoint: string, id: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', `${endpoint}/${id}`, { id });
  }

  async getPaginated<T>(
    endpoint: string,
    page = 1,
    pageSize = 20,
    filters?: Record<string, any>
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...filters,
    });
    return this.request<PaginatedResponse<T>>('GET', `${endpoint}?${queryParams}`);
  }
}

export const apiClient = new ApiClient();

export function initializeApiClient(tenant: TenantBranding) {
  const mode = (import.meta.env.VITE_BACKEND_MODE as BackendMode) || 'localStorage';
  
  apiClient.configure({
    mode,
    tenantId: tenant.id,
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    apiKey: import.meta.env.VITE_API_KEY,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  });
}

export default apiClient;