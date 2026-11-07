import mongoose from 'mongoose';
import { ActivityLog, IActivityLog } from '../models/ActivityLog.model.js';
import { ActivityCategory } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

export interface LogActivityInput {
  userId: string | mongoose.Types.ObjectId;
  action: string;
  category: ActivityCategory;
  description: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export interface GetActivityQuery {
  search?: string;
  category?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export class ActivityService {
  /**
   * Safely records an activity event. Non-blocking error handling ensures user workflows are never broken.
   */
  async logActivity(input: LogActivityInput): Promise<void> {
    try {
      if (!input.userId) return;

      const userObjectId =
        typeof input.userId === 'string'
          ? new mongoose.Types.ObjectId(input.userId)
          : input.userId;

      await ActivityLog.create({
        user: userObjectId,
        action: input.action.toUpperCase(),
        category: input.category,
        description: input.description,
        metadata: input.metadata || {},
        ip: input.ip || 'Unknown',
        userAgent: input.userAgent || 'Unknown',
      });
    } catch (err: unknown) {
      logger.error('Failed to write activity log', { error: err, input });
    }
  }

  /**
   * Returns paginated activity records for the user with search and filtering.
   */
  async getActivityLogs(
    userId: string,
    query: GetActivityQuery
  ): Promise<{
    logs: IActivityLog[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));

    const filter: mongoose.FilterQuery<IActivityLog> = {
      user: new mongoose.Types.ObjectId(userId),
    };

    if (query.category && query.category !== 'all') {
      filter.category = query.category as ActivityCategory;
    }

    if (query.action && query.action !== 'all') {
      filter.action = query.action.toUpperCase();
    }

    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { description: regex },
        { action: regex },
        { 'metadata.shortCode': regex },
        { 'metadata.originalUrl': regex },
        { ip: regex },
      ];
    }

    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (query.startDate) {
        dateFilter.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      filter.createdAt = dateFilter;
    }

    const sortOrder: Record<string, 1 | -1> = query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort(sortOrder).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(filter),
    ]);

    return {
      logs: logs as unknown as IActivityLog[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Deletes a single activity record by ID.
   */
  async deleteActivityLog(id: string, userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid activity log ID format.', 400);
    }

    const result = await ActivityLog.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new AppError('Activity log not found or access denied.', 404);
    }
  }

  /**
   * Bulk deletes selected activity records.
   */
  async bulkDeleteActivityLogs(userId: string, ids: string[]): Promise<{ deletedCount: number }> {
    if (!ids || ids.length === 0) {
      return { deletedCount: 0 };
    }

    const objectIds = ids
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const result = await ActivityLog.deleteMany({
      _id: { $in: objectIds },
      user: new mongoose.Types.ObjectId(userId),
    });

    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * Deletes all activity history for this user ONLY.
   * STRICT SAFETY GUARANTEE: This purges exclusively the ActivityLog collection.
   * It never touches user profile, short links, QR assets, analytics, or other data.
   */
  async deleteAllActivityLogs(userId: string): Promise<{ deletedCount: number }> {
    const result = await ActivityLog.deleteMany({
      user: new mongoose.Types.ObjectId(userId),
    });

    return { deletedCount: result.deletedCount || 0 };
  }
}

export const activityService = new ActivityService();

