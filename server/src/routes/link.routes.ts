import { Router } from 'express';
import { linkController } from '../controllers/link.controller.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { urlCreationLimiter } from '../middlewares/rateLimiter.middleware.js';
import { createLinkSchema, updateLinkSchema, bulkActionSchema } from '../validators/link.validator.js';

const router = Router();

// Create short link (auth optional: guests or authenticated users)
router.post('/', urlCreationLimiter, optionalAuth, validateBody(createLinkSchema), linkController.createLink);

// Link management endpoints (requires authentication)
router.get('/', requireAuth, linkController.listLinks);
router.post('/bulk', requireAuth, validateBody(bulkActionSchema), linkController.bulkActions);

// CSV Import & Export
router.get('/export', requireAuth, linkController.exportLinksCsv);
router.post('/import', requireAuth, linkController.importLinksCsv);

// Recycle Bin endpoints
router.get('/recycle-bin', requireAuth, linkController.getRecycleBin);
router.delete('/recycle-bin/empty', requireAuth, linkController.emptyRecycleBin);
router.post('/recycle-bin/bulk-restore', requireAuth, linkController.bulkRestore);
router.post('/recycle-bin/bulk-permanent-delete', requireAuth, linkController.bulkPermanentDelete);

// Individual Link operations
router.get('/:id', requireAuth, linkController.getLink);
router.patch('/:id', requireAuth, validateBody(updateLinkSchema), linkController.updateLink);
router.delete('/:id', requireAuth, linkController.deleteLink); // Moves to recycle bin
router.post('/:id/restore', requireAuth, linkController.restoreLink);
router.delete('/:id/permanent', requireAuth, linkController.permanentDeleteLink);
router.post('/:id/health-check', requireAuth, linkController.checkLinkHealth);

export default router;

