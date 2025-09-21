// Author: Putra Angga
// apps/frontend/lib/api/client.ts
import axios from 'axios';

const FALLBACK_API = 'http://localhost:3001';
const API_ROOT = process.env.NEXT_PUBLIC_API_URL || FALLBACK_API;

const apiClient = axios.create({
  baseURL: API_ROOT,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

console.log('[apiClient] baseURL =', apiClient.defaults.baseURL);

// NOTE: Use `any` here to avoid axios/ts typing mismatch for headers across versions.
// This keeps code simple and practical for a dev environment.
apiClient.interceptors.request.use(
  (config: any) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        if (!config.headers) config.headers = {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: any) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (res: any) => res,
  (err: any) => {
    if (err?.response?.status === 401) {
      console.warn('[apiClient] 401 - unauthorized');
      // optional: auto-logout or redirect to login
      // localStorage.removeItem('jwt_token');
      // window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default apiClient;
