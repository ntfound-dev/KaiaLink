// Author: Putra Angga
// apps/frontend/lib/api/auth.ts
import apiClient from './client';

export interface SignInResponse {
  accessToken?: string;
  token?: string;
  jwt?: string;
  user?: any;
}

export async function signInWithCredentials(email: string, password: string): Promise<any> {
  const { data } = await apiClient.post<SignInResponse>('/api/auth/signin', { email, password });

  const token = data?.accessToken ?? data?.token ?? data?.jwt ?? null;
  if (!token) {
    if (data && !token) {
      return data.user ?? data;
    }
    throw new Error('Login gagal — token tidak ditemukan pada response.');
  }

  localStorage.setItem('jwt_token', token);

  if (data.user) localStorage.setItem('user_profile', JSON.stringify(data.user));

  return data.user ?? null;
}

export function signOut() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_profile');
}
