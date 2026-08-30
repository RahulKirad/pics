import { randomUUID } from 'crypto';
import { loadEnv } from '@photo-platform/config';
import { NotFoundError } from '../../common/errors.js';
import { buildStorageKey } from '../../storage/key-builder.js';
import { getStorageProvider } from '../../storage/storage.factory.js';
import { eventService } from '../events/event.service.js';
import { generateQrPng, generateQrSvg } from './qr-generator.js';
import { qrRepository } from './qr.repository.js';

function buildGuestUrl(eventToken: string): string {
  const env = loadEnv();
  const base = env.PUBLIC_WEB_URL.replace(/\/$/, '');
  return `${base}/e/${eventToken}`;
}

function serializeQrCode(qr: {
  id: string;
  eventId: string;
  format: string;
  storageKey: string | null;
  svgContent: string | null;
  isBranded: boolean;
  createdAt: Date;
  updatedAt: Date;
}, guestUrl: string) {
  return {
    id: qr.id,
    eventId: qr.eventId,
    format: qr.format,
    isBranded: qr.isBranded,
    guestUrl,
    hasPng: !!qr.storageKey,
    hasSvg: !!qr.svgContent,
    previewUrl: `/api/v1/events/${qr.eventId}/qr/${qr.id}/preview`,
    downloadPngUrl: qr.storageKey ? `/api/v1/events/${qr.eventId}/qr/${qr.id}/download?format=png` : null,
    downloadSvgUrl: qr.svgContent ? `/api/v1/events/${qr.eventId}/qr/${qr.id}/download?format=svg` : null,
    createdAt: qr.createdAt.toISOString(),
    updatedAt: qr.updatedAt.toISOString(),
  };
}

export const qrService = {
  async listForEvent(eventId: string, businessId: string) {
    const event = await eventService.assertEventAccess(eventId, businessId);
    const guestUrl = buildGuestUrl(event.eventToken);
    const codes = await qrRepository.findByEvent(eventId);
    return {
      guestUrl,
      items: codes.map((qr) => serializeQrCode(qr, guestUrl)),
    };
  },

  async generate(
    eventId: string,
    businessId: string,
    input: { format: 'png' | 'svg' | 'both'; branded?: boolean },
  ) {
    const event = await eventService.assertEventAccess(eventId, businessId);
    const guestUrl = buildGuestUrl(event.eventToken);
    const branded = input.branded ?? false;
    const label = branded ? event.name : undefined;

    const qrId = randomUUID();
    let storageKey: string | undefined;
    let svgContent: string | undefined;
    const storage = getStorageProvider();

    if (input.format === 'png' || input.format === 'both') {
      const png = await generateQrPng(guestUrl, { branded, label, brandColor: '#111827' });
      storageKey = buildStorageKey(businessId, eventId, 'qr_codes', `${qrId}.png`);
      await storage.upload(storageKey, png, { mimeType: 'image/png', size: png.length });
    }

    if (input.format === 'svg' || input.format === 'both') {
      svgContent = await generateQrSvg(guestUrl, { branded, label, brandColor: '#111827' });
    }

    const primaryFormat = input.format === 'both' ? 'png' : input.format;

    const qr = await qrRepository.create({
      eventId,
      format: primaryFormat,
      storageKey,
      svgContent,
      isBranded: branded,
    });

    return serializeQrCode(qr, guestUrl);
  },

  async getPreview(eventId: string, businessId: string, qrId: string, format: 'png' | 'svg') {
    await eventService.assertEventAccess(eventId, businessId);
    const qr = await qrRepository.findById(qrId, eventId);
    if (!qr) throw new NotFoundError('QR code not found');

    if (format === 'svg') {
      if (!qr.svgContent) throw new NotFoundError('SVG QR code not available');
      return { contentType: 'image/svg+xml', body: Buffer.from(qr.svgContent, 'utf-8') };
    }

    if (!qr.storageKey) throw new NotFoundError('PNG QR code not available');
    const storage = getStorageProvider();
    const stream = await storage.download(qr.storageKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return { contentType: 'image/png', body: Buffer.concat(chunks) };
  },

  async getDownload(
    eventId: string,
    businessId: string,
    qrId: string,
    format: 'png' | 'svg',
  ) {
    const preview = await this.getPreview(eventId, businessId, qrId, format);
    const extension = format === 'svg' ? 'svg' : 'png';
    return {
      ...preview,
      filename: `event-${eventId}-qr.${extension}`,
    };
  },
};
