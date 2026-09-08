import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { MessageTemplate } from '../types';

const ENDPOINT = 'templates';

export interface TemplateFilters {
  channel?: 'whatsapp' | 'email' | 'both' | 'all';
  category?: string;
  search?: string;
}

export interface CreateTemplateData {
  name: string;
  channel: 'whatsapp' | 'email' | 'both';
  category: string;
  subject?: string;
  body: string;
  variables: string[];
  tenantId: string;
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {
  id: string;
}

export interface TestTemplateData {
  templateId: string;
  clientId: string;
}

export const templatesService = {
  async list(filters?: TemplateFilters, page = 1, pageSize = 50): Promise<ApiResponse<PaginatedResponse<MessageTemplate>>> {
    return apiClient.getPaginated<MessageTemplate>(ENDPOINT, page, pageSize, filters);
  },

  async getAll(filters?: TemplateFilters): Promise<ApiResponse<MessageTemplate[]>> {
    const response = await apiClient.get<MessageTemplate[]>(ENDPOINT);
    if (!response.success || !response.data) return response;
    
    let data = response.data;
    if (filters) {
      if (filters.channel && filters.channel !== 'all') {
        data = data.filter(t => t.channel === filters.channel || t.channel === 'both');
      }
      if (filters.category) {
        data = data.filter(t => t.category === filters.category);
      }
      if (filters.search) {
        const term = filters.search.toLowerCase();
        data = data.filter(t => 
          t.name.toLowerCase().includes(term) ||
          t.body.toLowerCase().includes(term)
        );
      }
    }
    return { success: true, data };
  },

  async getById(id: string): Promise<ApiResponse<MessageTemplate>> {
    return apiClient.get<MessageTemplate>(`${ENDPOINT}/${id}`);
  },

  async create(data: CreateTemplateData): Promise<ApiResponse<MessageTemplate>> {
    return apiClient.post<MessageTemplate>(ENDPOINT, data);
  },

  async update(data: UpdateTemplateData): Promise<ApiResponse<MessageTemplate>> {
    const { id, ...updates } = data;
    return apiClient.patch<MessageTemplate>(`${ENDPOINT}/${id}`, updates);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(ENDPOINT, id);
  },

  async test(data: TestTemplateData): Promise<ApiResponse<{ subject: string; body: string }>> {
    return apiClient.post(`${ENDPOINT}/test`, data);
  },

  async duplicate(id: string): Promise<ApiResponse<MessageTemplate>> {
    return apiClient.post<MessageTemplate>(`${ENDPOINT}/${id}/duplicate`, {});
  },

  getCategories(): string[] {
    return [
      'Cobranza',
      'Cumpleaños',
      'Renovación ACA',
      'Bienvenida',
      'Documento Requerido',
      'Confirmación de Cita',
      'General'
    ];
  },

  getVariables(): { tag: string; desc: string }[] {
    return [
      { tag: '{{nombre}}', desc: 'Nombre del cliente' },
      { tag: '{{apellido}}', desc: 'Apellido del cliente' },
      { tag: '{{nombre_completo}}', desc: 'Nombre completo' },
      { tag: '{{telefono}}', desc: 'Teléfono del cliente' },
      { tag: '{{email}}', desc: 'Email del cliente' },
      { tag: '{{poliza}}', desc: 'Número de póliza' },
      { tag: '{{compania}}', desc: 'Aseguradora (Carrier)' },
      { tag: '{{plan}}', desc: 'Nombre del plan' },
      { tag: '{{prima}}', desc: 'Prima mensual ($)' },
      { tag: '{{fecha_pago}}', desc: 'Día de cobro' },
      { tag: '{{fecha_efectiva}}', desc: 'Fecha efectiva de póliza' },
      { tag: '{{agente}}', desc: 'Nombre del asesor' },
      { tag: '{{agente_telefono}}', desc: 'Teléfono del asesor' },
      { tag: '{{empresa}}', desc: 'Nombre de la empresa' }
    ];
  },

  subscribe(callback: (templates: MessageTemplate[]) => void) {
    return apiClient.subscribe(ENDPOINT, callback);
  },
};

export default templatesService;