import { randomUUID } from 'crypto';
import type { GuestSelfieInput } from '@photo-platform/validation';
import { getFaceRecognitionProvider } from '@photo-platform/ai-client';
import type {
  DetectedFace,
  GuestSelfieSubmissionResult,
  GuestSelfieValidationResult,
} from '@photo-platform/shared-types';
import { ForbiddenError, NotFoundError, ValidationError } from '../../common/errors.js';
import { getStorageProvider } from '../../storage/storage.factory.js';
import { buildGuestSelfieStorageKey, getExtensionFromMime } from '../../storage/key-builder.js';
import { guestRepository } from './guest.repository.js';
import { parseGuestSelfieImage, pickPrimaryFace } from './guest-selfie.utils.js';
import { enqueueGuestFaceSearch } from '../../queues/guest-face-search.queue.js';

const DEFAULT_SIMILARITY_THRESHOLD = 0.6;

function assertSessionActive(expiresAt: Date, now = new Date()): void {
  if (expiresAt <= now) {
    throw new ForbiddenError('Your guest session has expired. Please start again.');
  }
}

function assertConsentGiven(consents: { consentGiven: boolean }[]): void {
  if (consents[0]?.consentGiven !== true) {
    throw new ForbiddenError('Consent required before taking a selfie.');
  }
}

async function runQualityCheck(
  buffer: Buffer,
  mimeType: string,
  primaryFace: DetectedFace | null,
): Promise<GuestSelfieValidationResult> {
  if (!primaryFace) {
    return {
      passed: false,
      score: 0,
      reason: 'No face detected. Center your face in the oval and try again.',
      faceCount: 0,
      boundingBox: null,
    };
  }

  const ai = getFaceRecognitionProvider();
  const quality = await ai.checkQuality(buffer, {
    mimeType,
    boundingBox: primaryFace.boundingBox,
  });

  return {
    passed: quality.passed,
    score: quality.score,
    reason: quality.reason ?? null,
    faceCount: 1,
    metrics: quality.metrics,
    boundingBox: primaryFace.boundingBox,
  };
}

async function validateSelfieBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<GuestSelfieValidationResult> {
  const ai = getFaceRecognitionProvider();
  const detection = await ai.detectFaces(buffer, mimeType);
  const primaryFace = pickPrimaryFace(detection.faces);
  const quality = await runQualityCheck(buffer, mimeType, primaryFace);

  return {
    ...quality,
    faceCount: detection.count || quality.faceCount,
  };
}

export const guestSelfieService = {
  async validateSelfie(sessionToken: string, input: GuestSelfieInput): Promise<GuestSelfieValidationResult> {
    const session = await guestRepository.findSessionByToken(sessionToken);
    if (!session) {
      throw new NotFoundError('Guest session not found');
    }
    assertSessionActive(session.expiresAt);
    assertConsentGiven(session.consents);

    const buffer = parseGuestSelfieImage(input.imageBase64, input.mimeType);
    return validateSelfieBuffer(buffer, input.mimeType);
  },

  async submitSelfie(
    sessionToken: string,
    input: GuestSelfieInput,
  ): Promise<GuestSelfieSubmissionResult> {
    const session = await guestRepository.findSessionByToken(sessionToken);
    if (!session) {
      throw new NotFoundError('Guest session not found');
    }
    assertSessionActive(session.expiresAt);
    assertConsentGiven(session.consents);

    const buffer = parseGuestSelfieImage(input.imageBase64, input.mimeType);
    const validation = await validateSelfieBuffer(buffer, input.mimeType);
    if (!validation.passed) {
      throw new ValidationError(validation.reason ?? 'Selfie did not pass quality checks');
    }

    const { quotaService } = await import('../billing/quota.service.js');
    await quotaService.assertCanRunFaceSearch(session.event.businessId);

    const searchId = randomUUID();
    const extension = getExtensionFromMime(input.mimeType);
    const storageKey = buildGuestSelfieStorageKey(
      session.event.businessId,
      session.eventId,
      searchId,
      extension,
    );

    const storage = getStorageProvider();
    await storage.upload(storageKey, buffer, { mimeType: input.mimeType, size: buffer.length });

    await guestRepository.createGuestSearch({
      id: searchId,
      guestSessionId: session.id,
      eventId: session.eventId,
      selfieStorageKey: storageKey,
      similarityThreshold: DEFAULT_SIMILARITY_THRESHOLD,
    });

    await guestRepository.incrementGuestSearchCount(session.eventId);

    try {
      await enqueueGuestFaceSearch(searchId);
    } catch (error) {
      await guestRepository.markGuestSearchFailed(
        searchId,
        error instanceof Error ? error.message : 'Failed to queue face search',
      );
      throw error;
    }

    return {
      searchId,
      status: 'pending',
    };
  },
};
