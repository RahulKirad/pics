import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth-store';

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Fetch a protected thumbnail/preview URL (requires photographer login). */
export async function fetchAuthenticatedImageBase64(
  apiPath: string,
): Promise<{ mimeType: string; base64: string; objectUrl: string }> {
  if (!useAuthStore.getState().isAuthenticated) {
    throw new Error('Sign in to load event photos.');
  }

  const path = apiPath.replace(/^\/api\/v1/, '');
  const { data } = await api.get(path, { responseType: 'blob' });
  const blob = data as Blob;
  const mimeType = blob.type || 'image/jpeg';
  const base64 = await blobToBase64(blob);
  const objectUrl = URL.createObjectURL(blob);
  return { mimeType, base64, objectUrl };
}

export async function readFileAsBase64(file: File): Promise<{ mimeType: string; base64: string; objectUrl: string }> {
  if (!useAuthStore.getState().isAuthenticated) {
    throw new Error('Sign in to analyze images from your device.');
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPEG, PNG, etc.).');
  }
  const base64 = await blobToBase64(file);
  const objectUrl = URL.createObjectURL(file);
  return { mimeType: file.type, base64, objectUrl };
}
