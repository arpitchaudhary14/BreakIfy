import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  editProfileSchema,
  changePasswordSchema,
  changeEmailSchema,
  verifyEmailSchema,
  revokeSessionSchema,
  deleteAccountSchema,
} from '../validators/auth.validator.js';

const router = Router();

// All user management routes require valid authentication
router.use(requireAuth);

router.get('/profile', userController.getProfile);
router.patch('/profile', validateBody(editProfileSchema), userController.updateProfile);
router.delete('/avatar', userController.removeAvatar);

router.post('/change-password', validateBody(changePasswordSchema), userController.changePassword);
router.post('/change-email', validateBody(changeEmailSchema), userController.requestEmailChange);
router.post('/confirm-email-change', validateBody(verifyEmailSchema), userController.confirmEmailChange);

router.get('/sessions', userController.getSessions);
router.post('/sessions/revoke', validateBody(revokeSessionSchema), userController.revokeSession);

router.delete('/account', validateBody(deleteAccountSchema), userController.deleteAccount);

export default router;

