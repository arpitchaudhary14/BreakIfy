import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware.js';
import {
  authLimiter,
  loginLimiter,
  signupLimiter,
  passwordResetLimiter,
  twoFactorLimiter,
} from '../middlewares/rateLimiter.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Registration & Login
router.post('/register', signupLimiter, validateBody(registerSchema), authController.register);
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);
router.post('/google', loginLimiter, validateBody(googleAuthSchema), authController.googleAuth);

// Two-Factor Authentication (TOTP)
router.post('/2fa/setup', requireAuth, authController.setup2FA);
router.post('/2fa/enable', requireAuth, twoFactorLimiter, authController.enable2FA);
router.post('/2fa/disable', requireAuth, twoFactorLimiter, authController.disable2FA);
router.post('/2fa/verify-login', twoFactorLimiter, authController.verify2FALogin);
router.post('/2fa/recovery-codes', requireAuth, twoFactorLimiter, authController.regenerateRecoveryCodes);

// Session Management
router.get('/sessions', requireAuth, authController.listSessions);
router.delete('/sessions/:sessionId', requireAuth, authController.revokeSession);
router.delete('/sessions', requireAuth, authController.revokeOtherSessions);

// Token Refresh & Logout
router.post('/refresh', authController.refresh);
router.post('/logout', optionalAuth, authController.logout);
router.get('/me', requireAuth, authController.getMe);

// Verification & Password Lifecycle
router.post('/verify-email', validateBody(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', authLimiter, authController.resendVerification);
router.post('/forgot-password', passwordResetLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateBody(resetPasswordSchema), authController.resetPassword);

export default router;
