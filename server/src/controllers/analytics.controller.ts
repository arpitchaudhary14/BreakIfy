import { Request, Response, NextFunction } from 'express';
import { analyticsService, AnalyticsQueryFilter } from '../services/analytics.service.js';

function parseFilterFromQuery(req: Request): AnalyticsQueryFilter {
  const {
    linkId,
    dateRange,
    startDate,
    endDate,
    includeBots,
    country,
    device,
  } = req.query;

  return {
    linkId: linkId ? String(linkId) : undefined,
    dateRange: (dateRange as AnalyticsQueryFilter['dateRange']) || '30d',
    startDate: startDate ? String(startDate) : undefined,
    endDate: endDate ? String(endDate) : undefined,
    includeBots: includeBots === 'true',
    country: country ? String(country) : undefined,
    device: device ? String(device) : undefined,
  };
}

export class AnalyticsController {
  async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const filter = parseFilterFromQuery(req);
      const data = await analyticsService.getOverview(ownerId, filter);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTimeSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const filter = parseFilterFromQuery(req);
      const data = await analyticsService.getTimeSeries(ownerId, filter);

      res.status(200).json({
        success: true,
        data: { series: data },
      });
    } catch (error) {
      next(error);
    }
  }

  async getBreakdowns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const filter = parseFilterFromQuery(req);
      const data = await analyticsService.getBreakdowns(ownerId, filter);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const filter = parseFilterFromQuery(req);
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
      const events = await analyticsService.getRecentEvents(ownerId, filter, limit);

      res.status(200).json({
        success: true,
        data: { events },
      });
    } catch (error) {
      next(error);
    }
  }

  async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const filter = parseFilterFromQuery(req);
      const csv = await analyticsService.exportCsv(ownerId, filter);

      const timestamp = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="breakify-analytics-${timestamp}.csv"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
