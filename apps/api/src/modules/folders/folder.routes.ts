import { Router } from 'express';
import { requireMinimumRole } from '../../middleware/authorize.js';
import { UserRole } from '@photo-platform/shared-types';
import {
  listFoldersHandler,
  createFolderHandler,
  updateFolderHandler,
  deleteFolderHandler,
} from './folder.controller.js';

export const folderRouter = Router({ mergeParams: true });

folderRouter.get('/', requireMinimumRole(UserRole.VIEWER), listFoldersHandler);
folderRouter.post('/', requireMinimumRole(UserRole.EDITOR), createFolderHandler);
folderRouter.patch('/:folderId', requireMinimumRole(UserRole.EDITOR), updateFolderHandler);
folderRouter.delete('/:folderId', requireMinimumRole(UserRole.EDITOR), deleteFolderHandler);
