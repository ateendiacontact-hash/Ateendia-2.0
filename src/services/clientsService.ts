import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { Client } from '../types';

const ENDPOINT = '/api/clients';

export interface ClientFilters {
  search?: string;
  category?: string;
  status?: string;
  assignedAgentId?: string;
  pipelineId?: string;
  stageId?: string;
  leadSource?: string; // whatsapp, instagram, facebook, landing, manual
}

export interface CreateClientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  birthDate?: string;
  gender?: 'M' | 'F' | 'Otro';
  idNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  maritalStatus?: 'Soltero/a' | 'Casado/a' | 'Divorciado/a' | 'Viudo/a' | 'Unión Libre';
  category?: string;
  tags?: string[];
  status?: Client['status'];
  assignedAgentId?: string;
  pipelineId?: string;
  stageId?: string;
  dealValue?: number;
  leadSource?: string; // Capta el canal de origen (WhatsApp, Instagram, Facebook, MicroLanding)
  customFields?: Record<string, any>;
  tenantId: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: string;
}

export const clientsService = {
  // Obtener clientes filtrados directamente desde D1
  async getAll(tenantId: string = 'tenant-demo', filters?: ClientFilters): Promise<ApiResponse<Client[]>> {
    try {
      const response = await fetch(`${ENDPOINT}?tenantId=${encodeURIComponent(tenantId)}`);
      if (!response.ok) {
        throw new Error('Error al consultar D1');
      }

      let data: Client[] = await response.json();

      if (filters) {
        if (filters.search) {
          const term = filters.search.toLowerCase();
          data = data.filter(c =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.phone.includes(filters.search) ||
            c.idNumber?.toLowerCase().includes(term)
          );
        }
        if (filters.category && filters.category !== 'all') {
          data = data.filter(c => c.category === filters.category);
        }
        if (filters.status && filters.status !== 'all') {
          data = data.filter(c => c.status === filters.status);
        }
        if (filters.assignedAgentId && filters.assignedAgentId !== 'all') {
          data = data.filter(c => c.assignedAgentId === filters.assignedAgentId);
        }
        if (filters.leadSource && filters.leadSource !== 'all') {
          data = data.filter(c => c.leadSource === filters.leadSource);
        }
      }

      return { success: true, data };
    } catch (error: any) {
      console.warn('📌 Error consultando API D1, usando fallback local:', error.message);
      return apiClient.get<Client[]>('clients');
    }
  },

  async list(filters?: ClientFilters, page = 1, pageSize = 50): Promise<ApiResponse<PaginatedResponse<Client>>> {
    return apiClient.getPaginated<Client>('clients', page, pageSize, filters);
  },

  async getById(id: string): Promise<ApiResponse<Client>> {
    return apiClient.get<Client>(`clients/${id}`);
  },

  // Crear cliente en D1 (Origen: Manual, WhatsApp, Instagram, Facebook o MicroLanding)
  async create(data: CreateClientData): Promise<ApiResponse<Client>> {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: data.tenantId,
          first_name: data.firstName,
          last_name: data.lastName || '',
          email: data.email,
          phone: data.phone,
          status: data.status || 'Lead',
          category: data.category || 'Regular',
          lead_source: data.leadSource || 'manual'
        }),
      });

      if (!response.ok) {
        throw new Error('Error al registrar cliente en Cloudflare D1');
      }

      const resData = await response.json();
      return {
        success: true,
        data: {
          id: resData.id,
          ...data,
          status: data.status || 'Lead',
          category: data.category || 'Regular',
          leadSource: data.leadSource || 'manual',
          createdAt: new Date().toISOString()
        } as unknown as Client
      };
    } catch (error: any) {
      console.error('Error guardando cliente en D1:', error);
      return apiClient.post<Client>('clients', data);
    }
  },

  async update(data: UpdateClientData): Promise<ApiResponse<Client>> {
    return apiClient.patch<Client>('clients', data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>('clients', id);
  },

  async bulkImport(clients: CreateClientData[]): Promise<ApiResponse<{ count: number; clients: Client[] }>> {
    return apiClient.post<{ count: number; clients: Client[] }>('clients/bulk', { clients });
  },

  async exportCsv(filters?: ClientFilters): Promise<ApiResponse<string>> {
    return apiClient.post<string>('clients/export', { filters });
  },

  subscribe(callback: (clients: Client[]) => void) {
    return apiClient.subscribe('clients', callback);
  },
};

export default clientsService;