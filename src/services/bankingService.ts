import { apiClient, ApiResponse, PaginatedResponse } from './apiClient';
import { BankAccount } from '../types';

const ENDPOINT = 'banking';

export interface BankAccountFilters {
  clientId?: string;
  type?: 'bank_account' | 'credit_card';
  isDefault?: boolean;
  verified?: boolean;
}

export interface CreateBankAccountData {
  clientId: string;
  clientName?: string;
  type: 'bank_account' | 'credit_card';
  accountHolder: string;
  holderIdNumber?: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: BankAccount['accountType'];
  paymentMethod: BankAccount['paymentMethod'];
  cardBrand?: BankAccount['cardBrand'];
  cardHolder?: string;
  cardNumber?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  cardExpDate?: string;
  cardCvv?: string;
  cardType?: BankAccount['cardType'];
  isDefault?: boolean;
  verified?: boolean;
  tenantId: string;
}

export interface UpdateBankAccountData extends Partial<CreateBankAccountData> {
  id: string;
}

export const bankingService = {
  async list(filters?: BankAccountFilters, page = 1, pageSize = 50): Promise<ApiResponse<PaginatedResponse<BankAccount>>> {
    return apiClient.getPaginated<BankAccount>(ENDPOINT, page, pageSize, filters);
  },

  async getAll(filters?: BankAccountFilters): Promise<ApiResponse<BankAccount[]>> {
    const response = await apiClient.get<BankAccount[]>(ENDPOINT);
    if (!response.success || !response.data) return response;
    
    let data = response.data;
    if (filters) {
      if (filters.clientId) {
        data = data.filter(b => b.clientId === filters.clientId);
      }
      if (filters.type) {
        data = data.filter(b => b.type === filters.type);
      }
      if (filters.isDefault !== undefined) {
        data = data.filter(b => b.isDefault === filters.isDefault);
      }
      if (filters.verified !== undefined) {
        data = data.filter(b => b.verified === filters.verified);
      }
    }
    return { success: true, data };
  },

  async getById(id: string): Promise<ApiResponse<BankAccount>> {
    return apiClient.get<BankAccount>(`${ENDPOINT}/${id}`);
  },

  async getByClientId(clientId: string): Promise<ApiResponse<BankAccount[]>> {
    return this.getAll({ clientId });
  },

  async getDefaultByClientId(clientId: string): Promise<ApiResponse<BankAccount | null>> {
    const response = await this.getAll({ clientId, isDefault: true });
    if (response.success && response.data && response.data.length > 0) {
      return { success: true, data: response.data[0] };
    }
    return { success: true, data: null };
  },

  async create(data: CreateBankAccountData): Promise<ApiResponse<BankAccount>> {
    return apiClient.post<BankAccount>(ENDPOINT, data);
  },

  async update(data: UpdateBankAccountData): Promise<ApiResponse<BankAccount>> {
    const { id, ...updates } = data;
    return apiClient.patch<BankAccount>(`${ENDPOINT}/${id}`, updates);
  },

  async setDefault(clientId: string, paymentMethodId: string): Promise<ApiResponse<BankAccount[]>> {
    return apiClient.post<BankAccount[]>(`${ENDPOINT}/set-default`, { clientId, paymentMethodId });
  },

  async verify(id: string): Promise<ApiResponse<BankAccount>> {
    return apiClient.patch<BankAccount>(`${ENDPOINT}/${id}/verify`, { verified: true });
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(ENDPOINT, id);
  },

  async getBanks(): Promise<ApiResponse<string[]>> {
    return apiClient.get(`${ENDPOINT}/catalogs/banks`);
  },

  async getPaymentMethods(): Promise<ApiResponse<string[]>> {
    return apiClient.get(`${ENDPOINT}/catalogs/payment-methods`);
  },

  subscribe(callback: (accounts: BankAccount[]) => void) {
    return apiClient.subscribe(ENDPOINT, callback);
  },
};

export default bankingService;