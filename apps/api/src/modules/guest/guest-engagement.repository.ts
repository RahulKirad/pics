import { prisma } from '../../database/client.js';

export const guestEngagementRepository = {
  listFavoritePhotoIds(guestSessionId: string, eventId: string): Promise<string[]> {
    return prisma.favorite
      .findMany({
        where: { guestSessionId, eventId },
        select: { photoId: true },
        orderBy: { createdAt: 'desc' },
      })
      .then((rows) => rows.map((row) => row.photoId));
  },

  findFavorite(guestSessionId: string, photoId: string) {
    return prisma.favorite.findFirst({
      where: { guestSessionId, photoId },
    });
  },

  async toggleFavorite(guestSessionId: string, eventId: string, photoId: string): Promise<boolean> {
    const existing = await this.findFavorite(guestSessionId, photoId);
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return false;
    }

    await prisma.favorite.create({
      data: {
        photoId,
        guestSessionId,
        eventId,
      },
    });
    return true;
  },

  createDownload(data: {
    photoId: string;
    guestSessionId: string;
    eventId: string;
    businessId: string;
    ipAddress?: string;
  }) {
    return prisma.download.create({ data });
  },

  incrementEventDownloadCount(eventId: string) {
    return prisma.event.update({
      where: { id: eventId },
      data: { downloadCount: { increment: 1 } },
    });
  },
};
