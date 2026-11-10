import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GuestSessionSummary } from '@/types/domain';

interface GuestState {
  eventToken: string | null;
  sessionToken: string | null;
  expiresAt: string | null;
  hasConsent: boolean;
  consentVersion: string | null;
  activeSearchId: string | null;
  setSession: (session: GuestSessionSummary) => void;
  setConsent: (consentVersion: string) => void;
  setActiveSearch: (searchId: string) => void;
  clear: () => void;
  isSessionValid: (eventToken?: string) => boolean;
}

const initialState = {
  eventToken: null,
  sessionToken: null,
  expiresAt: null,
  hasConsent: false,
  consentVersion: null,
  activeSearchId: null,
};

export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setSession: (session) =>
        set({
          eventToken: session.eventToken,
          sessionToken: session.sessionToken,
          expiresAt: session.expiresAt ?? null,
          hasConsent: session.hasConsent ?? session.consentGiven,
          consentVersion: session.consentVersion,
        }),
      setConsent: (consentVersion) =>
        set({
          hasConsent: true,
          consentVersion,
        }),
      setActiveSearch: (searchId) => set({ activeSearchId: searchId }),
      clear: () => set(initialState),
      isSessionValid: (eventToken) => {
        const state = get();
        if (!state.sessionToken) return false;
        if (eventToken && state.eventToken !== eventToken) return false;
        if (state.expiresAt) return new Date(state.expiresAt).getTime() > Date.now();
        return true;
      },
    }),
    {
      name: 'photo-platform-guest-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        eventToken: state.eventToken,
        sessionToken: state.sessionToken,
        expiresAt: state.expiresAt,
        hasConsent: state.hasConsent,
        consentVersion: state.consentVersion,
        activeSearchId: state.activeSearchId,
      }),
    },
  ),
);
