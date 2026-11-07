import { Request, Response, NextFunction } from 'express';
import { abuseService } from '../services/abuse.service.js';
import { AppError } from '../utils/AppError.js';

export class AbuseController {
  /**
   * POST /api/v1/abuse/report
   * Public endpoint to report suspicious or abusive links
   */
  async submitReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { shortCode, originalUrl, reason, details, reporterEmail } = req.body;

      if (!shortCode) {
        throw new AppError('shortCode is required', 400);
      }
      if (!reason) {
        throw new AppError('Valid abuse reason is required', 400);
      }
      if (!details || details.trim().length < 5) {
        throw new AppError('Please provide details regarding the abuse report (at least 5 characters)', 400);
      }

      const report = await abuseService.submitReport({
        shortCode,
        originalUrl,
        reason,
        details,
        reporterEmail,
        reporterIp: req.ip || req.socket.remoteAddress,
      });

      res.status(201).json({
        success: true,
        message: 'Thank you. Your abuse report has been submitted and queued for review.',
        data: {
          reportId: report._id,
          status: report.status,
          createdAt: report.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/abuse/reports
   * Admin-only review list
   */
  async listReports(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as unknown as { user?: { role?: string } }).user;
      if (user?.role !== 'admin') {
        throw new AppError('Forbidden: Admin access required', 403);
      }

      const { status, reason, page, limit } = req.query;
      const result = await abuseService.listReports({
        status: status as 'pending' | 'investigating' | 'resolved' | 'dismissed',
        reason: reason as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/abuse/reports/:reportId
   * Admin-only moderation action
   */
  async resolveReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as unknown as { user?: { id: string; role?: string } }).user;
      if (user?.role !== 'admin') {
        throw new AppError('Forbidden: Admin access required', 403);
      }

      const { reportId } = req.params;
      const { status, adminNotes, actionTaken } = req.body;

      if (!status) {
        throw new AppError('status is required', 400);
      }

      const updated = await abuseService.resolveReport(reportId, user.id, {
        status,
        adminNotes,
        actionTaken,
      });

      res.status(200).json({
        success: true,
        message: 'Abuse report updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const abuseController = new AbuseController();
