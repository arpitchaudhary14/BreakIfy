import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service.js';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { unreadOnly, page, limit } = req.query;

      const result = await notificationService.getNotifications(userId, {
        unreadOnly: unreadOnly === 'true',
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 15,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;

      await notificationService.markAsRead(id, userId);

      res.status(200).json({
        success: true,
        data: { message: 'Notification marked as read.' },
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const result = await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        data: {
          message: 'All notifications marked as read.',
          modifiedCount: result.modifiedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;

      await notificationService.deleteNotification(id, userId);

      res.status(200).json({
        success: true,
        data: { message: 'Notification deleted.' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();

