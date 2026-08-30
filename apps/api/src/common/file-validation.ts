import { ALLOWED_IMAGE_MIMES, type AllowedImageMime } from '../storage/types.js';
import { ValidationError } from './errors.js';

const MAGIC_BYTES: Record<AllowedImageMime, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP starts with RIFF....WEBP)
};

export function validateMimeType(mimeType: string): AllowedImageMime {
  if (!ALLOWED_IMAGE_MIMES.includes(mimeType as AllowedImageMime)) {
    throw new ValidationError(`Unsupported file type: ${mimeType}`, 'INVALID_MIME_TYPE');
  }
  return mimeType as AllowedImageMime;
}

export function validateFileSignature(buffer: Buffer, mimeType: AllowedImageMime): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  for (const sig of signatures) {
    if (sig.every((byte, i) => buffer[i] === byte)) {
      if (mimeType === 'image/webp') {
        return buffer.slice(8, 12).toString('ascii') === 'WEBP';
      }
      return true;
    }
  }
  return false;
}

export function validateFileSize(size: number, maxMb: number): void {
  const maxBytes = maxMb * 1024 * 1024;
  if (size <= 0) {
    throw new ValidationError('File is empty', 'EMPTY_FILE');
  }
  if (size > maxBytes) {
    throw new ValidationError(`File exceeds maximum size of ${maxMb}MB`, 'FILE_TOO_LARGE');
  }
}
