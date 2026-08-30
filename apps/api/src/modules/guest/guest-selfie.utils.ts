import type { DetectedFace } from '@photo-platform/shared-types';
import { ValidationError } from '../../common/errors.js';
import { validateFileSignature, validateFileSize, validateMimeType } from '../../common/file-validation.js';

const GUEST_SELFIE_MAX_MB = 5;

export function decodeBase64Image(imageBase64: string): Buffer {
  const trimmed = imageBase64.trim();
  const payload = trimmed.includes(',') ? trimmed.split(',')[1]! : trimmed;

  if (!payload) {
    throw new ValidationError('Invalid image data', 'INVALID_IMAGE');
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(payload, 'base64');
  } catch {
    throw new ValidationError('Invalid image encoding', 'INVALID_IMAGE');
  }

  if (buffer.length === 0) {
    throw new ValidationError('Image is empty', 'EMPTY_FILE');
  }

  return buffer;
}

export function parseGuestSelfieImage(imageBase64: string, mimeType: string): Buffer {
  const buffer = decodeBase64Image(imageBase64);
  const validatedMime = validateMimeType(mimeType);
  validateFileSize(buffer.length, GUEST_SELFIE_MAX_MB);

  if (!validateFileSignature(buffer, validatedMime)) {
    throw new ValidationError('Image content does not match declared type', 'INVALID_IMAGE');
  }

  return buffer;
}

export function pickPrimaryFace(faces: DetectedFace[]): DetectedFace | null {
  if (faces.length === 0) return null;

  return faces.reduce((best, face) => {
    const area = face.boundingBox.width * face.boundingBox.height;
    const bestArea = best.boundingBox.width * best.boundingBox.height;
    return area > bestArea ? face : best;
  });
}
