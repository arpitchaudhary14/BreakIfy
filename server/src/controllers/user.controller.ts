import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service.js';
import { clearAuthCookies } from './auth.controller.js';
import { activityService } from '../services/activity.service.js';
import { notificationService } from '../services/notification.service.js';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await userService.getProfile(req.user!._id.toString());
      res.status(200).json({ success: true, data: { user: profile } });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { name, avatar } = req.body;
      const updated = await userService.updateProfile(userId, { name, avatar });

      await activityService.logActivity({
        userId,
        action: 'PROFILE_UPDATE',
        category: 'settings',
        description: 'Updated profile details',
        metadata: { name, avatarChanged: Boolean(avatar) },
      });

      res.status(200).json({ success: true, data: { user: updated } });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(userId, currentPassword, newPassword);

      await activityService.logActivity({
        userId,
        action: 'PASSWORD_CHANGE',
        category: 'security',
        description: 'Account password changed',
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      await notificationService.createNotification({
        userId,
        title: 'Security Alert: Password Changed',
        message: 'Your account password was successfully updated. If this was not you, reset it immediately.',
        type: 'warning',
        link: '/settings',
      });

      res.status(200).json({
        success: true,
        data: { message: 'Password updated successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }

  async requestEmailChange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { currentPassword, newEmail } = req.body;
      await userService.requestEmailChange(userId, currentPassword, newEmail);

      await activityService.logActivity({
        userId,
        action: 'EMAIL_CHANGE_REQUEST',
        category: 'security',
        description: `Requested email change to ${newEmail}`,
      });

      res.status(200).json({
        success: true,
        data: {
          message: `A verification link has been sent to ${newEmail}. Please click it to complete the update.`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmEmailChange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      const result = await userService.confirmEmailChange(token);

      res.status(200).json({
        success: true,
        data: {
          message: `Email updated successfully to ${result.newEmail}.`,
          email: result.newEmail,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async removeAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await userService.removeAvatar(req.user!._id.toString());
      res.status(200).json({ success: true, data: { user: updated } });
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await userService.getSessions(req.user!._id.toString(), req.sessionId);
      res.status(200).json({ success: true, data: { sessions } });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.body;
      await userService.revokeSession(req.user!._id.toString(), sessionId, req.sessionId);

      res.status(200).json({
        success: true,
        data: { message: 'Session revoked successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { password } = req.body;
      await userService.deleteAccount(req.user!._id.toString(), password);
      clearAuthCookies(res);

      res.status(200).json({
        success: true,
        data: { message: 'Your account has been deleted permanently.' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();

