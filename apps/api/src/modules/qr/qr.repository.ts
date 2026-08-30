import { prisma } from '../../database/client.js';

export const qrRepository = {
  async findByEvent(eventId: string) {
    return prisma.qrCode.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(qrId: string, eventId: string) {
    return prisma.qrCode.findFirst({
      where: { id: qrId, eventId },
    });
  },

  async create(data: {
    eventId: string;
    format: string;
    storageKey?: string;
    svgContent?: string;
    isBranded: boolean;
  }) {
    return prisma.qrCode.create({ data });
  },
};
