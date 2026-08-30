import type { CreateFolderInput, UpdateFolderInput } from '@photo-platform/validation';
import { NotFoundError, ForbiddenError } from '../../common/errors.js';
import { eventService } from '../events/event.service.js';
import { folderRepository } from './folder.repository.js';

function serializeFolder(folder: {
  id: string;
  eventId: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: { photos: number };
}) {
  return {
    id: folder.id,
    eventId: folder.eventId,
    name: folder.name,
    parentId: folder.parentId,
    sortOrder: folder.sortOrder,
    photoCount: folder._count?.photos ?? 0,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  };
}

export const folderService = {
  async list(eventId: string, businessId: string) {
    await eventService.assertEventAccess(eventId, businessId);
    const folders = await folderRepository.list(eventId, businessId);
    return folders.map(serializeFolder);
  },

  async create(eventId: string, businessId: string, input: CreateFolderInput) {
    await eventService.assertEventAccess(eventId, businessId);

    if (input.parentId) {
      const parent = await folderRepository.findById(input.parentId, eventId, businessId);
      if (!parent) throw new NotFoundError('Parent folder not found');
    }

    const folder = await folderRepository.create({
      eventId,
      businessId,
      name: input.name,
      parentId: input.parentId,
      sortOrder: input.sortOrder ?? 0,
    });

    return serializeFolder(folder);
  },

  async update(eventId: string, businessId: string, folderId: string, input: UpdateFolderInput) {
    await eventService.assertEventAccess(eventId, businessId);

    const existing = await folderRepository.findById(folderId, eventId, businessId);
    if (!existing) throw new NotFoundError('Folder not found');

    if (input.parentId) {
      if (input.parentId === folderId) {
        throw new ForbiddenError('Folder cannot be its own parent');
      }
      const parent = await folderRepository.findById(input.parentId, eventId, businessId);
      if (!parent) throw new NotFoundError('Parent folder not found');
    }

    await folderRepository.update(folderId, eventId, businessId, {
      name: input.name,
      parentId: input.parentId,
      sortOrder: input.sortOrder,
    });

    const updated = await folderRepository.findById(folderId, eventId, businessId);
    return serializeFolder({ ...updated!, _count: { photos: await folderRepository.countPhotos(folderId) } });
  },

  async delete(eventId: string, businessId: string, folderId: string) {
    await eventService.assertEventAccess(eventId, businessId);

    const photoCount = await folderRepository.countPhotos(folderId);
    if (photoCount > 0) {
      throw new ForbiddenError('Cannot delete folder with photos. Move or delete photos first.');
    }

    const result = await folderRepository.delete(folderId, eventId, businessId);
    if (result.count === 0) throw new NotFoundError('Folder not found');
  },
};
