import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = 'http://localhost:5000/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const { accessToken, setAccessToken, logout } = useAuthStore.getState();

  const headers: any = {
    ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    ...options.headers,
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
        const { accessToken: newAccessToken } = await refreshRes.json();
        setAccessToken(newAccessToken);

        // Retry the original request with the new token
        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newAccessToken}`,
        };
        response = await fetch(`${BASE_URL}${endpoint}`, { ...config, headers: newHeaders });
      } else {
        // Refresh failed, logout user
        logout();
        window.location.href = '/login';
      }
    } catch (err) {
      logout();
      window.location.href = '/login';
    }
  }

  return response;
}
