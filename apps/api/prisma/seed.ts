import { PlanTier, PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/common/password.js';

const prisma = new PrismaClient();

const PLANS = [
  {
    tier: PlanTier.FREE,
    name: 'Free Trial',
    description: 'Get started with PhotoFlow',
    priceMonthly: 0,
    priceYearly: 0,
    maxEvents: 3,
    maxStorageGb: 5,
    maxPhotos: 500,
    maxAiProcessing: 500,
    maxFaceSearches: 200,
    maxBandwidthGb: 5,
    maxDownloads: 200,
    maxTeamMembers: 2,
    brandingEnabled: false,
  },
  {
    tier: PlanTier.STARTER,
    name: 'Starter',
    description: 'For solo photographers getting started',
    priceMonthly: 99900,
    priceYearly: 999000,
    maxEvents: 15,
    maxStorageGb: 50,
    maxPhotos: 10000,
    maxAiProcessing: 10000,
    maxFaceSearches: 5000,
    maxBandwidthGb: 50,
    maxDownloads: 5000,
    maxTeamMembers: 3,
    brandingEnabled: false,
  },
  {
    tier: PlanTier.PROFESSIONAL,
    name: 'Professional',
    description: 'For busy event photographers and small studios',
    priceMonthly: 249900,
    priceYearly: 2499000,
    maxEvents: 50,
    maxStorageGb: 200,
    maxPhotos: 50000,
    maxAiProcessing: 50000,
    maxFaceSearches: 25000,
    maxBandwidthGb: 200,
    maxDownloads: 25000,
    maxTeamMembers: 10,
    brandingEnabled: true,
  },
  {
    tier: PlanTier.STUDIO,
    name: 'Studio',
    description: 'For photography studios with high volume events',
    priceMonthly: 499900,
    priceYearly: 4999000,
    maxEvents: 200,
    maxStorageGb: 1000,
    maxPhotos: 250000,
    maxAiProcessing: 250000,
    maxFaceSearches: 100000,
    maxBandwidthGb: 1000,
    maxDownloads: 100000,
    maxTeamMembers: 25,
    brandingEnabled: true,
  },
] as const;

async function main() {
  for (const plan of PLANS) {
    const saved = await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        maxEvents: plan.maxEvents,
        maxStorageGb: plan.maxStorageGb,
        maxPhotos: plan.maxPhotos,
        maxAiProcessing: plan.maxAiProcessing,
        maxFaceSearches: plan.maxFaceSearches,
        maxBandwidthGb: plan.maxBandwidthGb,
        maxDownloads: plan.maxDownloads,
        maxTeamMembers: plan.maxTeamMembers,
        brandingEnabled: plan.brandingEnabled,
        isActive: true,
      },
      create: plan,
    });
    console.log('Seeded plan:', saved.tier);
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (superAdminEmail && superAdminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: superAdminEmail.toLowerCase() } });
    if (!existing) {
      const passwordHash = await hashPassword(superAdminPassword);
      await prisma.user.create({
        data: {
          email: superAdminEmail.toLowerCase(),
          passwordHash,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'SUPER_ADMIN',
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });
      console.log('Seeded super admin:', superAdminEmail);
    } else {
      console.log('Super admin already exists');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
