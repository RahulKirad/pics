import axios from 'axios';
import type {
  ApiResponse,
  GuestConsentResult,
  GuestEventPublic,
  GuestFavoriteToggleResult,
  GuestSearchResult,
  GuestSelfieSubmissionResult,
  GuestSelfieValidationResult,
  GuestSessionSummary,
} from '@photo-platform/shared-types';
import { GUEST_CONSENT_VERSION } from '@photo-platform/shared-types';

export const guestApi = axios.create({
  baseURL: '/api/v1/guest',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const guestService = {
  async getEvent(eventToken: string): Promise<GuestEventPublic> {
    const { data } = await guestApi.get<ApiResponse<GuestEventPublic>>(`/events/${eventToken}`);
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async createSession(eventToken: string): Promise<GuestSessionSummary> {
    const { data } = await guestApi.post<ApiResponse<GuestSessionSummary>>(
      `/events/${eventToken}/sessions`,
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async getSession(sessionToken: string): Promise<GuestSessionSummary> {
    const { data } = await guestApi.get<ApiResponse<GuestSessionSummary>>(
      `/sessions/${sessionToken}`,
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async recordConsent(sessionToken: string): Promise<GuestConsentResult> {
    const { data } = await guestApi.post<ApiResponse<GuestConsentResult>>(
      `/sessions/${sessionToken}/consent`,
      {
        consentGiven: true,
        consentVersion: GUEST_CONSENT_VERSION,
      },
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async validateSelfie(
    sessionToken: string,
    payload: { imageBase64: string; mimeType?: string },
  ): Promise<GuestSelfieValidationResult> {
    const { data } = await guestApi.post<ApiResponse<GuestSelfieValidationResult>>(
      `/sessions/${sessionToken}/selfie/validate`,
      payload,
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async submitSelfie(
    sessionToken: string,
    payload: { imageBase64: string; mimeType?: string },
  ): Promise<GuestSelfieSubmissionResult> {
    const { data } = await guestApi.post<ApiResponse<GuestSelfieSubmissionResult>>(
      `/sessions/${sessionToken}/selfie`,
      payload,
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async getSearchResult(sessionToken: string, searchId: string): Promise<GuestSearchResult> {
    const { data } = await guestApi.get<ApiResponse<GuestSearchResult>>(
      `/sessions/${sessionToken}/searches/${searchId}`,
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async toggleFavorite(
    sessionToken: string,
    photoId: string,
  ): Promise<GuestFavoriteToggleResult> {
    const { data } = await guestApi.post<ApiResponse<GuestFavoriteToggleResult>>(
      `/sessions/${sessionToken}/photos/${photoId}/favorite`,
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },

  async deleteMyData(sessionToken: string) {
    const { data } = await guestApi.delete<ApiResponse<{ deleted: boolean; sessionsRemoved: number; selfiesRemoved: number }>>(
      `/sessions/${sessionToken}/data`,
    );
    if (!data.success) throw new Error(data.error.message);
    return data.data;
  },
};
