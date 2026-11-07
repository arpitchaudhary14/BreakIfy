import { Router } from 'express';
import { activityController } from '../controllers/activity.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', activityController.getActivityLogs);
router.post('/bulk-delete', activityController.bulkDeleteActivityLogs);
router.delete('/clear-all', activityController.clearAllHistory);
router.delete('/:id', activityController.deleteActivityLog);

export default router;

