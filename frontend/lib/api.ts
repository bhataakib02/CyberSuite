import { useAuthStore } from '../store/useAuthStore';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

const BASE_URL = 'http://localhost:5000/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const { accessToken, setAccessToken, logout } = useAuthStore.getState();

  const headers: Record<string, string> = {
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  let response = await fetch(`${BASE_URL}${endpoint}`, config);

  // If unauthorized (token expired), try to refresh
  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const jsonRes = await refreshRes.json();
        const newAccessToken = jsonRes.data?.accessToken || jsonRes.accessToken;
        
        if (!newAccessToken) {
          logout();
          window.location.href = '/login';
          return response;
        }

        setAccessToken(newAccessToken);

        // Retry the original request with the new token
        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newAccessToken}`,
        };
        response = await fetch(`${BASE_URL}${endpoint}`, { ...config, headers: newHeaders });
      } else {
        if (refreshRes.status >= 500) {
          // Temporary server issue, don't logout
          return response;
        }
        // Refresh failed, logout user
        logout();
        window.location.href = '/login';
      }
    } catch (err) {
      // Network error, don't logout
      console.error('Refresh request failed', err);
      return response;
    }
  }

  return response;
}
