import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { env } from '../config/env.js';

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProduction = env.NODE_ENV === 'production';

  // Access Token (15 minutes)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  // Refresh Token (7 days)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: `${env.API_PREFIX}/auth/refresh`,
  });
}

export function clearAuthCookies(res: Response): void {
  const isProduction = env.NODE_ENV === 'production';

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: `${env.API_PREFIX}/auth/refresh`,
  });
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.register(name, email, password, userAgent, ipAddress);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          message: 'Registration successful. Please sign in with your new credentials.',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.login(email, password, userAgent, ipAddress);

      if (result.requires2FA) {
        res.status(200).json({
          success: true,
          data: {
            requires2FA: true,
            tempToken: result.tempToken,
            user: result.user,
          },
        });
        return;
      }

      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          requires2FA: false,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async verify2FALogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tempToken, token, recoveryCode } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      if (!tempToken) {
        res.status(400).json({ success: false, error: { message: 'Missing 2FA temporary authentication token.' } });
        return;
      }

      if (!token && !recoveryCode) {
        res.status(400).json({
          success: false,
          error: { message: 'Please provide either a 6-digit TOTP code or a single-use backup recovery code.' },
        });
        return;
      }

      const result = await authService.verify2FALogin(tempToken, token, recoveryCode, userAgent, ipAddress);
      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async setup2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const result = await authService.setup2FA(user._id.toString());
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async enable2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      const { token } = req.body;
      if (!user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      if (!token) {
        res.status(400).json({ success: false, error: { message: 'Verification code is required.' } });
        return;
      }

      const result = await authService.enable2FA(user._id.toString(), token);
      res.status(200).json({
        success: true,
        message: 'Two-factor authentication enabled successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async disable2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      const { password, token } = req.body;
      if (!user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      await authService.disable2FA(user._id.toString(), password, token);
      res.status(200).json({
        success: true,
        message: 'Two-factor authentication disabled successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  async regenerateRecoveryCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      const { token } = req.body;
      if (!user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      if (!token) {
        res.status(400).json({ success: false, error: { message: 'Verification code is required.' } });
        return;
      }

      const result = await authService.regenerateRecoveryCodes(user._id.toString(), token);
      res.status(200).json({
        success: true,
        message: 'New recovery codes generated successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const sessions = await authService.listSessions(user._id.toString(), req.sessionId);
      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      const { sessionId } = req.params;
      if (!user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      await authService.revokeSession(user._id.toString(), sessionId);
      res.status(200).json({
        success: true,
        message: 'Session revoked successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeOtherSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user || !req.sessionId) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      await authService.revokeOtherSessions(user._id.toString(), req.sessionId);
      res.status(200).json({
        success: true,
        message: 'All other active sessions have been revoked.',
      });
    } catch (error) {
      next(error);
    }
  }

  async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.googleLogin(idToken, userAgent, ipAddress);
      setAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ success: false, error: { message: 'No refresh token provided.' } });
        return;
      }

      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const tokens = await authService.refreshTokens(refreshToken, userAgent, ipAddress);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

      res.status(200).json({
        success: true,
        data: {
          message: 'Token refreshed successfully',
        },
      });
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user && req.sessionId) {
        await authService.logout(req.user._id.toString(), req.sessionId);
      }
      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        data: { message: 'Signed out successfully' },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            avatar: user.avatar || '',
            isEmailVerified: user.isEmailVerified,
            authProvider: user.authProvider,
            twoFactorEnabled: !!user.twoFactorEnabled,
            role: user.role || 'user',
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      await authService.verifyEmail(token);

      res.status(200).json({
        success: true,
        data: { message: 'Email address verified successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = req.body.email || req.user?.email;
      if (!email) {
        res.status(400).json({ success: false, error: { message: 'Email is required.' } });
        return;
      }

      await authService.resendVerification(email);

      res.status(200).json({
        success: true,
        data: { message: 'If an account exists, a verification link has been resent.' },
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        data: { message: 'If that email belongs to an account, we sent password reset instructions.' },
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        data: { message: 'Password has been reset successfully. Please sign in with your new password.' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
