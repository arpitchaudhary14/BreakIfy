import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service.js';

export class ActivityController {
  async getActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { search, category, action, startDate, endDate, page, limit, sort } = req.query;

      const result = await activityService.getActivityLogs(userId, {
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        action: action ? String(action) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 20,
        sort: sort ? String(sort) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteActivityLog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;

      await activityService.deleteActivityLog(id, userId);

      res.status(200).json({
        success: true,
        data: { message: 'Activity log deleted successfully.' },
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkDeleteActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { ids } = req.body;

      if (!Array.isArray(ids)) {
        res.status(400).json({
          success: false,
          error: { message: 'Array of record IDs required.' },
        });
        return;
      }

      const result = await activityService.bulkDeleteActivityLogs(userId, ids);

      res.status(200).json({
        success: true,
        data: {
          message: `${result.deletedCount} activity record(s) deleted.`,
          deletedCount: result.deletedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async clearAllHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const result = await activityService.deleteAllActivityLogs(userId);

      res.status(200).json({
        success: true,
        data: {
          message: 'All activity history has been cleared successfully.',
          deletedCount: result.deletedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const activityController = new ActivityController();

