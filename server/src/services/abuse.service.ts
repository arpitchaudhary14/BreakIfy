import mongoose from 'mongoose';
import { AbuseReport, IAbuseReport, AbuseReportStatus, AbuseActionTaken, AbuseReason } from '../models/AbuseReport.model.js';
import { Link } from '../models/Link.model.js';
import { AppError } from '../utils/AppError.js';
import { activityService } from './activity.service.js';

export interface CreateAbuseReportInput {
  shortCode: string;
  originalUrl?: string;
  reason: AbuseReason;
  details: string;
  reporterEmail?: string;
  reporterIp?: string;
}

export interface ListAbuseReportsFilter {
  status?: AbuseReportStatus;
  reason?: string;
  page?: number;
  limit?: number;
}

export class AbuseService {
  /**
   * Submit an abuse report for a short link
   */
  async submitReport(input: CreateAbuseReportInput): Promise<IAbuseReport> {
    const cleanCode = input.shortCode.trim().replace(/^\//, '');

    // Look up link if it exists
    const link = await Link.findOne({
      $or: [{ customAlias: cleanCode }, { shortCode: cleanCode }],
      isDeleted: false,
    });

    const report = await AbuseReport.create({
      shortCode: cleanCode,
      originalUrl: input.originalUrl || link?.originalUrl || 'Unknown destination',
      linkId: link?._id,
      reason: input.reason,
      details: input.details.trim(),
      reporterEmail: input.reporterEmail?.trim().toLowerCase(),
      reporterIp: input.reporterIp || '127.0.0.1',
      status: 'pending',
      actionTaken: 'none',
    });

    return report;
  }

  /**
   * List abuse reports (Admin access)
   */
  async listReports(filter: ListAbuseReportsFilter) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.reason) query.reason = filter.reason;

    const [reports, total] = await Promise.all([
      AbuseReport.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AbuseReport.countDocuments(query),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Moderate report (Update status & optionally take action on link)
   */
  async resolveReport(
    reportId: string,
    adminUserId: string,
    action: {
      status: AbuseReportStatus;
      adminNotes?: string;
      actionTaken?: AbuseActionTaken;
    }
  ): Promise<IAbuseReport> {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      throw new AppError('Invalid abuse report ID format.', 400);
    }

    const report = await AbuseReport.findById(reportId);
    if (!report) {
      throw new AppError('Abuse report not found', 404);
    }

    report.status = action.status;
    if (action.adminNotes !== undefined) report.adminNotes = action.adminNotes;
    if (action.actionTaken !== undefined) report.actionTaken = action.actionTaken;

    if (action.status === 'resolved' || action.status === 'dismissed') {
      report.resolvedAt = new Date();
      report.resolvedBy = new mongoose.Types.ObjectId(adminUserId) as unknown as typeof report.resolvedBy;
    }

    // If action is link_suspended and link exists, deactivate it
    if (action.actionTaken === 'link_suspended' && report.linkId) {
      const link = await Link.findById(report.linkId);
      if (link) {
        link.status = 'inactive';
        await link.save();

        await activityService.logActivity({
          userId: adminUserId,
          action: 'LINK_EDIT',
          category: 'security',
          description: `Suspended short link /${link.shortCode} due to abuse report #${report._id}`,
          metadata: { reportId: report._id, shortCode: link.shortCode },
        });
      }
    }

    await report.save();
    return report;
  }
}

export const abuseService = new AbuseService();
