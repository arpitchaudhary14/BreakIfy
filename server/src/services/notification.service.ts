import mongoose from 'mongoose';
import { Notification, INotification } from '../models/Notification.model.js';
import { NotificationType } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

export interface CreateNotificationInput {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  metadata?: Record<string, unknown>;
}

export class NotificationService {
  /**
   * Safely dispatches a new notification to a user.
   */
  async createNotification(input: CreateNotificationInput): Promise<INotification | null> {
    try {
      if (!input.userId) return null;

      const userObjectId =
        typeof input.userId === 'string'
          ? new mongoose.Types.ObjectId(input.userId)
          : input.userId;

      const doc = await Notification.create({
        user: userObjectId,
        title: input.title,
        message: input.message,
        type: input.type || 'info',
        link: input.link,
        metadata: input.metadata || {},
      });

      return doc;
    } catch (err) {
      logger.error('Failed to create in-app notification', { error: err, input });
      return null;
    }
  }

  /**
   * Fetches paginated notifications for the user.
   */
  async getNotifications(
    userId: string,
    query: { unreadOnly?: boolean; page?: number; limit?: number } = {}
  ): Promise<{
    notifications: INotification[];
    unreadCount: number;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 15));

    const filter: mongoose.FilterQuery<INotification> = {
      user: new mongoose.Types.ObjectId(userId),
    };

    if (query.unreadOnly) {
      filter.isRead = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        user: new mongoose.Types.ObjectId(userId),
        isRead: false,
      }),
    ]);

    return {
      notifications: notifications as unknown as INotification[],
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Marks a single notification as read.
   */
  async markAsRead(id: string, userId: string): Promise<void> {
    const result = await Notification.updateOne(
      {
        _id: new mongoose.Types.ObjectId(id),
        user: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: { isRead: true },
      }
    );

    if (result.matchedCount === 0) {
      throw new AppError('Notification not found or access denied.', 404);
    }
  }

  /**
   * Marks all notifications for a user as read.
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await Notification.updateMany(
      {
        user: new mongoose.Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    return { modifiedCount: result.modifiedCount || 0 };
  }

  /**
   * Deletes a notification by ID.
   */
  async deleteNotification(id: string, userId: string): Promise<void> {
    const result = await Notification.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new AppError('Notification not found or access denied.', 404);
    }
  }
}

export const notificationService = new NotificationService();

