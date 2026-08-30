import { prisma } from '../../database/client.js';

export const folderRepository = {
  async list(eventId: string, businessId: string) {
    return prisma.folder.findMany({
      where: { eventId, businessId },
      include: { _count: { select: { photos: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  },

  async findById(folderId: string, eventId: string, businessId: string) {
    return prisma.folder.findFirst({
      where: { id: folderId, eventId, businessId },
    });
  },

  async create(data: {
    eventId: string;
    businessId: string;
    name: string;
    parentId?: string;
    sortOrder?: number;
  }) {
    return prisma.folder.create({ data });
  },

  async update(folderId: string, eventId: string, businessId: string, data: {
    name?: string;
    parentId?: string | null;
    sortOrder?: number;
  }) {
    return prisma.folder.updateMany({
      where: { id: folderId, eventId, businessId },
      data,
    });
  },

  async delete(folderId: string, eventId: string, businessId: string) {
    return prisma.folder.deleteMany({
      where: { id: folderId, eventId, businessId },
    });
  },

  async countPhotos(folderId: string) {
    return prisma.photo.count({ where: { folderId } });
  },
};
