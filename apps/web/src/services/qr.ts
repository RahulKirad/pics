import type { QrCodeSummary } from '@/types/domain';

/** QR codes are generated client-side for Bolt hosting (no API). */
export const qrService = {
  async listByEvent(eventId: string): Promise<QrCodeSummary[]> {
    return [
      {
        id: eventId,
        eventId,
        label: 'Guest QR',
        scanCount: 0,
        createdAt: new Date().toISOString(),
        imageUrl: null,
      },
    ];
  },

  async generate(_eventId: string, _label: string): Promise<QrCodeSummary> {
    throw new Error('Use the event guest link / QR from the event dashboard');
  },
};
