import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiUtils';
import { safeGetFromLocalStorage, safeSetToLocalStorage, safeRemoveFromLocalStorage } from '../lib/safeJsonParse';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T>(
  apiCall: () => Promise<any>,
  deps: any[] = [],
  options: UseApiOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCall();
      
      if (response.error) {
        const errorMessage = response.error.error || 'An error occurred';
        setState(prev => ({ ...prev, loading: false, error: errorMessage, data: null }));
        onError?.(errorMessage);
      } else {
        setState(prev => ({ ...prev, loading: false, error: null, data: response.data }));
        onSuccess?.(response.data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage, data: null }));
      onError?.(errorMessage);
    }
  }, deps);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  return {
    ...state,
    execute,
    refetch,
  };
}

// Specific hooks for common API operations
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const token = localStorage.getItem('authToken');
    const userProfile = safeGetFromLocalStorage('userProfile', null);

    if (token && userProfile) {
      setIsAuthenticated(true);
      setUser(userProfile);
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role?: 'student' | 'candidate' | 'company') => {
    const mappedRole = role === 'student' ? 'candidate' : role;
    const response = await apiClient.login(email, password, mappedRole as any);

    if (response.error) {
      throw new Error(response.error.error);
    }

    localStorage.setItem('authToken', response.data.token);
    safeSetToLocalStorage('userProfile', response.data.user);
    setIsAuthenticated(true);
    setUser(response.data.user);

    return response.data;
  };

  const register = async (userData: any) => {
    const response = await apiClient.register(userData);

    if (response.error) {
      throw new Error(response.error.error);
    }

    localStorage.setItem('authToken', response.data.token);
    safeSetToLocalStorage('userProfile', response.data.user);
    setIsAuthenticated(true);
    setUser(response.data.user);

    return response.data;
  };

  const logout = () => {
    safeRemoveFromLocalStorage('authToken');
    safeRemoveFromLocalStorage('userProfile');
    setIsAuthenticated(false);
    setUser(null);
  };

  return {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    logout,
  };
}

export function useProfile() {
  return useApi(
    () => apiClient.getProfile(),
    [],
    { immediate: true }
  );
}

export function useJobMatches() {
  return useApi(
    () => apiClient.getJobMatches(),
    [],
    { immediate: false } // Don't load immediately, wait for user to be ready
  );
}

export function useProfileStatus() {
  return useApi(
    () => apiClient.getProfileStatus(),
    [],
    { immediate: true }
  );
}

export function useMyApplications() {
  return useApi(
    () => apiClient.getMyApplications(),
    [],
    { immediate: false }
  );
}

export function useCompanyListings() {
  return useApi(
    () => apiClient.getMyListings(),
    [],
    { immediate: false }
  );
}

export function useReceivedApplications() {
  return useApi(
    () => apiClient.getReceivedApplications(),
    [],
    { immediate: false }
  );
}

export function useDashboardAnalytics() {
  return useApi(
    () => apiClient.getDashboardAnalytics(),
    [],
    { immediate: false }
  );
}

// Custom hook for form submissions
export function useFormSubmission<T>(
  submitFn: (data: T) => Promise<any>,
  options: {
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (data: T) => {
    setLoading(true);
    setError(null);

    try {
      const response = await submitFn(data);
      
      if (response.error) {
        const errorMessage = response.error.error || 'Submission failed';
        setError(errorMessage);
        options.onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      setLoading(false);
      options.onSuccess?.(response.data);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      setLoading(false);
      options.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    submit,
    loading,
    error,
    clearError: () => setError(null),
  };
}

// Hook for infinite scrolling/pagination
export function usePagination<T>(
  fetchFn: (offset: number, limit: number) => Promise<any>,
  limit: number = 10
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn(offset, limit);
      
      if (response.error) {
        setError(response.error.error);
        return;
      }

      const newItems = response.data.items || response.data;
      const pagination = response.data.pagination;

      setItems(prev => offset === 0 ? newItems : [...prev, ...newItems]);
      setOffset(offset + limit);
      setHasMore(pagination?.hasMore ?? newItems.length === limit);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load more items');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, offset, limit, loading, hasMore]);

  const refresh = useCallback(() => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
  }, []);

  useEffect(() => {
    loadMore();
  }, []);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
