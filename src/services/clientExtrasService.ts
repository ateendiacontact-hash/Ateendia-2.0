import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { ClientDocument, ClientNote, ClientActivity } from '../types';

const DOCUMENTS_ENDPOINT = 'documents';
const NOTES_ENDPOINT = 'notes';
const ACTIVITIES_ENDPOINT = 'activities';

export interface DocumentFilters {
  clientId?: string;
  type?: string;
  status?: ClientDocument['status'];
}

export interface CreateDocumentData {
  clientId: string;
  name: string;
  type: string;
  fileUrl?: string;
  previewUrl?: string;
  fileSize?: string;
  expirationDate?: string;
  status: ClientDocument['status'];
  verifiedBy?: string;
  description?: string;
  tenantId: string;
}

export interface NoteFilters {
  clientId?: string;
  category?: ClientNote['category'];
  userId?: string;
}

export interface CreateNoteData {
  clientId: string;
  userId: string;
  userName: string;
  userRole?: string;
  userAvatar?: string;
  content: string;
  category: ClientNote['category'];
  images?: string[];
  tenantId: string;
}

export interface ActivityFilters {
  clientId?: string;
  type?: ClientActivity['type'];
  userId?: string;
}

export interface CreateActivityData {
  clientId: string;
  type: ClientActivity['type'];
  title: string;
  description: string;
  userId: string;
  userName: string;
  metadata?: Record<string, any>;
  tenantId: string;
}

export const documentsService = {
  async list(filters?: DocumentFilters, page = 1, pageSize = 50): Promise<ApiResponse<PaginatedResponse<ClientDocument>>> {
    return apiClient.getPaginated<ClientDocument>(DOCUMENTS_ENDPOINT, page, pageSize, filters);
  },

  async getAll(filters?: DocumentFilters): Promise<ApiResponse<ClientDocument[]>> {
    const response = await apiClient.get<ClientDocument[]>(DOCUMENTS_ENDPOINT);
    if (!response.success || !response.data) return response;
    
    let data = response.data;
    if (filters) {
      if (filters.clientId) data = data.filter(d => d.clientId === filters.clientId);
      if (filters.type) data = data.filter(d => d.type === filters.type);
      if (filters.status) data = data.filter(d => d.status === filters.status);
    }
    return { success: true, data };
  },

  async getById(id: string): Promise<ApiResponse<ClientDocument>> {
    return apiClient.get<ClientDocument>(`${DOCUMENTS_ENDPOINT}/${id}`);
  },

  async getByClientId(clientId: string): Promise<ApiResponse<ClientDocument[]>> {
    return this.getAll({ clientId });
  },

  async create(data: CreateDocumentData): Promise<ApiResponse<ClientDocument>> {
    return apiClient.post<ClientDocument>(DOCUMENTS_ENDPOINT, data);
  },

  async update(id: string, data: Partial<CreateDocumentData>): Promise<ApiResponse<ClientDocument>> {
    return apiClient.patch<ClientDocument>(`${DOCUMENTS_ENDPOINT}/${id}`, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(DOCUMENTS_ENDPOINT, id);
  },

  async upload(file: File, clientId: string, metadata: Omit<CreateDocumentData, 'fileUrl' | 'previewUrl' | 'fileSize'>): Promise<ApiResponse<ClientDocument>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);
    formData.append('metadata', JSON.stringify(metadata));
    
    const response = await fetch(`${apiClient.getConfig().baseUrl || '/api'}${DOCUMENTS_ENDPOINT}/upload`, {
      method: 'POST',
      headers: apiClient.getConfig().apiKey ? { 'Authorization': `Bearer ${apiClient.getConfig().apiKey}` } : {},
      body: formData,
    });
    
    const result = await response.json();
    return response.ok 
      ? { success: true, data: result }
      : { success: false, error: result.message };
  },

  subscribe(callback: (documents: ClientDocument[]) => void) {
    return apiClient.subscribe(DOCUMENTS_ENDPOINT, callback);
  },
};

export const notesService = {
  async list(filters?: NoteFilters, page = 1, pageSize = 50): Promise<ApiResponse<PaginatedResponse<ClientNote>>> {
    return apiClient.getPaginated<ClientNote>(NOTES_ENDPOINT, page, pageSize, filters);
  },

  async getAll(filters?: NoteFilters): Promise<ApiResponse<ClientNote[]>> {
    const response = await apiClient.get<ClientNote[]>(NOTES_ENDPOINT);
    if (!response.success || !response.data) return response;
    
    let data = response.data;
    if (filters) {
      if (filters.clientId) data = data.filter(n => n.clientId === filters.clientId);
      if (filters.category) data = data.filter(n => n.category === filters.category);
      if (filters.userId) data = data.filter(n => n.userId === filters.userId);
    }
    return { success: true, data };
  },

  async getById(id: string): Promise<ApiResponse<ClientNote>> {
    return apiClient.get<ClientNote>(`${NOTES_ENDPOINT}/${id}`);
  },

  async getByClientId(clientId: string): Promise<ApiResponse<ClientNote[]>> {
    return this.getAll({ clientId });
  },

  async create(data: CreateNoteData): Promise<ApiResponse<ClientNote>> {
    return apiClient.post<ClientNote>(NOTES_ENDPOINT, data);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(NOTES_ENDPOINT, id);
  },

  subscribe(callback: (notes: ClientNote[]) => void) {
    return apiClient.subscribe(NOTES_ENDPOINT, callback);
  },
};

export const activitiesService = {
  async list(filters?: ActivityFilters, page = 1, pageSize = 50): Promise<ApiResponse<PaginatedResponse<ClientActivity>>> {
    return apiClient.getPaginated<ClientActivity>(ACTIVITIES_ENDPOINT, page, pageSize, filters);
  },

  async getAll(filters?: ActivityFilters): Promise<ApiResponse<ClientActivity[]>> {
    const response = await apiClient.get<ClientActivity[]>(ACTIVITIES_ENDPOINT);
    if (!response.success || !response.data) return response;
    
    let data = response.data;
    if (filters) {
      if (filters.clientId) data = data.filter(a => a.clientId === filters.clientId);
      if (filters.type) data = data.filter(a => a.type === filters.type);
      if (filters.userId) data = data.filter(a => a.userId === filters.userId);
    }
    return { success: true, data };
  },

  async getById(id: string): Promise<ApiResponse<ClientActivity>> {
    return apiClient.get<ClientActivity>(`${ACTIVITIES_ENDPOINT}/${id}`);
  },

  async getByClientId(clientId: string): Promise<ApiResponse<ClientActivity[]>> {
    return this.getAll({ clientId });
  },

  async create(data: CreateActivityData): Promise<ApiResponse<ClientActivity>> {
    return apiClient.post<ClientActivity>(ACTIVITIES_ENDPOINT, data);
  },

  subscribe(callback: (activities: ClientActivity[]) => void) {
    return apiClient.subscribe(ACTIVITIES_ENDPOINT, callback);
  },
};

export type { ClientDocument, ClientNote, ClientActivity };