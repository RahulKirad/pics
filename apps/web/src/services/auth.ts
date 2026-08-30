import type { ApiResponse, AuthSession } from '@photo-platform/shared-types';
import type { RegisterInput, LoginInput } from '@photo-platform/validation';
import { api } from './api';
import { useAuthStore } from '@/stores/auth-store';

export const authService = {
  async register(input: RegisterInput): Promise<AuthSession> {
    const { data } = await api.post<ApiResponse<AuthSession>>('/auth/register', input);
    if (!data.success) throw new Error(data.error.message);
    useAuthStore.getState().setSession(data.data);
    return data.data;
  },

  async login(input: LoginInput): Promise<AuthSession> {
    const { data } = await api.post<ApiResponse<AuthSession>>('/auth/login', input);
    if (!data.success) throw new Error(data.error.message);
    useAuthStore.getState().setSession(data.data);
    return data.data;
  },

  async refresh(): Promise<AuthSession | null> {
    try {
      const { data } = await api.post<ApiResponse<AuthSession>>('/auth/refresh');
      if (!data.success) return null;
      useAuthStore.getState().setSession(data.data);
      return data.data;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      useAuthStore.getState().clearSession();
    }
  },

  async getMe() {
    const { data } = await api.get<
      ApiResponse<AuthSession['user'] & { business: AuthSession['business']; businessRole: AuthSession['businessRole'] }>
    >('/auth/me');
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async initialize(): Promise<void> {
    const store = useAuthStore.getState();
    try {
      await authService.refresh();
    } catch {
      store.clearSession();
    } finally {
      store.setInitialized(true);
    }
  },
};
