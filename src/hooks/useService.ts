import { useState, useCallback, useRef } from 'react';
import { ApiResponse } from '../services';

export interface UseServiceOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  showToast?: boolean;
}

export interface UseServiceResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<ApiResponse<T> | null>;
  reset: () => void;
}

export function useService<T>(
  serviceFn: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseServiceOptions<T> = {}
): UseServiceResult<T> {
  const { onSuccess, onError, showToast = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toastRef = useRef<any>(null);

  const execute = useCallback(async (...args: any[]): Promise<ApiResponse<T> | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await serviceFn(...args);
      
      if (response.success) {
        setData(response.data || null);
        onSuccess?.(response.data as T);
        
        if (showToast && response.message) {
          showToastNotification(response.message, 'success');
        }
        
        return response;
      } else {
        setError(response.error || 'An error occurred');
        onError?.(response.error || 'An error occurred');
        
        if (showToast) {
          showToastNotification(response.error || 'An error occurred', 'error');
        }
        
        return response;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unexpected error';
      setError(errorMessage);
      onError?.(errorMessage);
      
      if (showToast) {
        showToastNotification(errorMessage, 'error');
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [serviceFn, onSuccess, onError, showToast]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}

export function useServiceList<T>(
  serviceFn: (filters?: any, page?: number, pageSize?: number) => Promise<ApiResponse<any>>,
  options: UseServiceOptions<T[]> = {}
) {
  const { onSuccess, onError, showToast = false } = options;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  const execute = useCallback(async (filters?: any, page = 1, pageSize = 20) => {
    setLoading(true);
    setError(null);

    try {
      const response = await serviceFn(filters, page, pageSize);
      
      if (response.success && response.data) {
        const { data: items, total, page: currentPage, pageSize: currentPageSize, totalPages } = response.data;
        setData(items);
        setPagination({ page: currentPage, pageSize: currentPageSize, total, totalPages });
        onSuccess?.(items);
        
        if (showToast && response.message) {
          showToastNotification(response.message, 'success');
        }
        
        return response;
      } else {
        setError(response.error || 'Failed to load data');
        onError?.(response.error || 'Failed to load data');
        
        if (showToast) {
          showToastNotification(response.error || 'Failed to load data', 'error');
        }
        
        return response;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unexpected error';
      setError(errorMessage);
      onError?.(errorMessage);
      
      if (showToast) {
        showToastNotification(errorMessage, 'error');
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [serviceFn, onSuccess, onError, showToast]);

  const loadMore = useCallback(async (filters?: any) => {
    if (pagination.page < pagination.totalPages) {
      return execute(filters, pagination.page + 1, pagination.pageSize);
    }
    return null;
  }, [execute, pagination.page, pagination.totalPages, pagination.pageSize]);

  const reset = useCallback(() => {
    setData([]);
    setLoading(false);
    setError(null);
    setPagination({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  }, []);

  return { 
    data, 
    loading, 
    error, 
    execute, 
    loadMore, 
    reset,
    pagination,
    hasMore: pagination.page < pagination.totalPages,
  };
}

function showToastNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window === 'undefined') return;
  
  const container = getOrCreateToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span class="toast-message">${message}</span>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  container.appendChild(toast);
  
  toast.querySelector('.toast-close')?.addEventListener('click', () => {
    toast.remove();
  });
  
  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function getOrCreateToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function useMutation<T>(
  mutationFn: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseServiceOptions<T> = {}
) {
  return useService(mutationFn, options);
}

export function useQuery<T>(
  queryFn: () => Promise<ApiResponse<T>>,
  options: UseServiceOptions<T> & { enabled?: boolean } = {}
) {
  const { enabled = true, ...rest } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    if (!enabled) return { success: false, error: 'Query disabled' };
    
    setLoading(true);
    setError(null);

    try {
      const response = await queryFn();
      
      if (response.success) {
        setData(response.data || null);
        rest.onSuccess?.(response.data as T);
        return response;
      } else {
        setError(response.error || 'An error occurred');
        rest.onError?.(response.error || 'An error occurred');
        return response;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Unexpected error';
      setError(errorMessage);
      rest.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [queryFn, enabled, rest]);

  return { data, loading, error, execute, refetch: execute };
}