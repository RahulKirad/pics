import { prisma } from '../../database/client.js';
import type { Prisma } from '@prisma/client';
import type { StorageSettingsInput } from '@photo-platform/validation';
import { loadEnv } from '@photo-platform/config';

const SETTINGS_KEY = 'storage.provider';

export const storageSettingsService = {
  async getSettings() {
    const env = loadEnv();
    const stored = await prisma.systemSetting.findUnique({ where: { key: SETTINGS_KEY } });

    const defaults = {
      provider: env.STORAGE_DRIVER,
      endpoint: env.S3_ENDPOINT ?? '',
      bucket: env.S3_BUCKET,
      region: env.S3_REGION,
      accessKey: env.S3_ACCESS_KEY ? '********' : '',
      secretKey: env.S3_SECRET_KEY ? '********' : '',
      vpsRootPath: env.STORAGE_ROOT,
      cdnUrl: env.CDN_URL ?? '',
      maxFileSizeMb: env.MAX_FILE_SIZE_MB,
      storageQuotaGb: 100,
    };

    if (!stored) return defaults;

    const value = stored.value as Record<string, unknown>;
    return {
      ...defaults,
      ...value,
      accessKey: value.accessKey ? '********' : '',
      secretKey: value.secretKey ? '********' : '',
    };
  },

  async updateSettings(input: StorageSettingsInput, updatedBy: string) {
    const existing = await prisma.systemSetting.findUnique({ where: { key: SETTINGS_KEY } });
    const currentValue = (existing?.value as Record<string, unknown>) ?? {};

    const newValue: Record<string, unknown> = {
      ...currentValue,
      provider: input.provider,
      endpoint: input.endpoint ?? currentValue.endpoint,
      bucket: input.bucket ?? currentValue.bucket,
      region: input.region ?? currentValue.region,
      vpsRootPath: input.vpsRootPath ?? currentValue.vpsRootPath,
      cdnUrl: input.cdnUrl ?? currentValue.cdnUrl,
      maxFileSizeMb: input.maxFileSizeMb ?? currentValue.maxFileSizeMb,
      storageQuotaGb: input.storageQuotaGb ?? currentValue.storageQuotaGb,
    };

    if (input.accessKey && input.accessKey !== '********') {
      newValue.accessKey = input.accessKey;
    }
    if (input.secretKey && input.secretKey !== '********') {
      newValue.secretKey = input.secretKey;
    }

    await prisma.systemSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        category: 'storage',
        value: newValue as Prisma.InputJsonValue,
        updatedBy,
      },
      update: {
        value: newValue as Prisma.InputJsonValue,
        updatedBy,
      },
    });

    return this.getSettings();
  },
};
