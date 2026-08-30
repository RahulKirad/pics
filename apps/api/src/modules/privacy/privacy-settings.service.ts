import type { PrivacySettings } from '@photo-platform/shared-types';
import { privacySettingsSchema } from '@photo-platform/validation';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/client.js';

const SETTINGS_KEY = 'privacy.retention';

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  guestSessionRetentionDays: 7,
  guestSelfieRetentionDays: 30,
  autoExpireEvents: true,
};

export const privacySettingsService = {
  async getSettings(): Promise<PrivacySettings> {
    const stored = await prisma.systemSetting.findUnique({ where: { key: SETTINGS_KEY } });
    if (!stored) {
      return DEFAULT_PRIVACY_SETTINGS;
    }

    const parsed = privacySettingsSchema.safeParse(stored.value);
    return parsed.success ? parsed.data : DEFAULT_PRIVACY_SETTINGS;
  },

  async updateSettings(input: unknown, updatedBy: string): Promise<PrivacySettings> {
    const settings = privacySettingsSchema.parse(input);

    await prisma.systemSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        category: 'privacy',
        value: settings as Prisma.InputJsonValue,
        updatedBy,
      },
      update: {
        value: settings as Prisma.InputJsonValue,
        updatedBy,
      },
    });

    return settings;
  },
};
