import { create } from 'zustand';
import type { AuthSession, AuthUser, AuthBusiness, UserRole } from '@/types/domain';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  business: AuthBusiness | null;
  businessRole: UserRole | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  setInitialized: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  business: null,
  businessRole: null,
  isAuthenticated: false,
  isInitialized: false,
  setSession: (session) =>
    set({
      accessToken: session.accessToken,
      user: session.user,
      business: session.business,
      businessRole: session.businessRole,
      isAuthenticated: true,
    }),
  clearSession: () =>
    set({
      accessToken: null,
      user: null,
      business: null,
      businessRole: null,
      isAuthenticated: false,
    }),
  setInitialized: (value) => set({ isInitialized: value }),
}));

export function isSuperAdmin(): boolean {
  return false;
}
