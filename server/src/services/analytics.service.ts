import mongoose from 'mongoose';
import { ClickEvent, IClickEvent } from '../models/ClickEvent.model.js';
import { Link } from '../models/Link.model.js';

export interface AnalyticsQueryFilter {
  linkId?: string;
  dateRange?: '24h' | '7d' | '30d' | '90d' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
  includeBots?: boolean;
  country?: string;
  device?: string;
}

export class AnalyticsService {
  /**
   * Builds the MongoDB match filter based on owner and user-specified query constraints.
   */
  private buildMatchFilter(ownerId: string, filter: AnalyticsQueryFilter): mongoose.FilterQuery<IClickEvent> {
    const match: mongoose.FilterQuery<IClickEvent> = {
      owner: new mongoose.Types.ObjectId(ownerId),
    };

    if (filter.linkId && filter.linkId !== 'all') {
      match.link = new mongoose.Types.ObjectId(filter.linkId);
    }

    if (!filter.includeBots) {
      match.isBot = false;
    }

    if (filter.country && filter.country !== 'all') {
      match.country = filter.country.toUpperCase();
    }

    if (filter.device && filter.device !== 'all') {
      match.device = filter.device.toLowerCase();
    }

    // Date range filtering
    const now = new Date();
    let start: Date | null = null;
    let end: Date = now;

    if (filter.startDate) {
      start = new Date(filter.startDate);
      if (filter.endDate) {
        end = new Date(filter.endDate);
      }
    } else {
      switch (filter.dateRange) {
        case '24h':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          start = null;
          break;
        case '30d':
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    if (start) {
      match.timestamp = { $gte: start, $lte: end };
    }

    return match;
  }

  /**
   * Retrieves high-level analytics summary: total clicks, estimated unique visitors,
   * QR scans, and top performing link.
   */
  async getOverview(ownerId: string, filter: AnalyticsQueryFilter) {
    const match = this.buildMatchFilter(ownerId, filter);

    const [summaryResult, botCount, topLinkAgg] = await Promise.all([
      ClickEvent.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: 1 },
            qrScans: { $sum: { $cond: ['$isQr', 1, 0] } },
            uniqueVisitorsSet: { $addToSet: '$visitorHash' },
          },
        },
      ]),
      // Count total automated crawler hits in same window
      ClickEvent.countDocuments({
        ...match,
        isBot: true,
      }),
      // Find top link in this interval
      ClickEvent.aggregate([
        { $match: match },
        { $group: { _id: '$link', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const summary = summaryResult[0] || {
      totalClicks: 0,
      qrScans: 0,
      uniqueVisitorsSet: [],
    };

    let topLinkData = null;
    if (topLinkAgg.length > 0 && topLinkAgg[0]._id) {
      const foundLink = await Link.findById(topLinkAgg[0]._id).select('title shortCode originalUrl');
      if (foundLink) {
        topLinkData = {
          _id: foundLink._id,
          title: foundLink.title,
          shortCode: foundLink.shortCode,
          originalUrl: foundLink.originalUrl,
          clicksInPeriod: topLinkAgg[0].count,
        };
      }
    }

    const totalClicks = summary.totalClicks;
    const uniqueVisitors = summary.uniqueVisitorsSet ? summary.uniqueVisitorsSet.length : 0;
    const qrScans = summary.qrScans;
    const qrShare = totalClicks > 0 ? Number(((qrScans / totalClicks) * 100).toFixed(1)) : 0;

    return {
      totalClicks,
      uniqueVisitors,
      qrScans,
      qrShare,
      botClicks: botCount,
      topLink: topLinkData,
    };
  }

  /**
   * Retrieves continuous time-series analytics (daily or hourly) for trending charts.
   */
  async getTimeSeries(ownerId: string, filter: AnalyticsQueryFilter) {
    const match = this.buildMatchFilter(ownerId, filter);
    const isHourly = filter.dateRange === '24h';
    const formatString = isHourly ? '%Y-%m-%d %H:00' : '%Y-%m-%d';

    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format: formatString,
              date: '$timestamp',
            },
          },
          clicks: { $sum: 1 },
          qrScans: { $sum: { $cond: ['$isQr', 1, 0] } },
          visitorsSet: { $addToSet: '$visitorHash' },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          clicks: 1,
          qrScans: 1,
          uniqueVisitors: { $size: '$visitorsSet' },
        },
      },
      { $sort: { date: 1 } },
    ];

    const results = await ClickEvent.aggregate(pipeline);
    return results;
  }

  /**
   * Aggregates categorical breakdowns (Devices, Browsers, OS, Countries, Referrers).
   */
  async getBreakdowns(ownerId: string, filter: AnalyticsQueryFilter) {
    const match = this.buildMatchFilter(ownerId, filter);

    const [deviceAgg, browserAgg, osAgg, countryAgg, referrerAgg, totalResult] = await Promise.all([
      ClickEvent.aggregate([
        { $match: match },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      ClickEvent.aggregate([
        { $match: match },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      ClickEvent.aggregate([
        { $match: match },
        { $group: { _id: '$os', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      ClickEvent.aggregate([
        { $match: match },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ClickEvent.aggregate([
        { $match: match },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ClickEvent.countDocuments(match),
    ]);

    const total = Math.max(1, totalResult);

    const formatList = (list: Array<{ _id: string; count: number }>) =>
      list.map((item) => ({
        name: item._id || 'Unknown',
        count: item.count,
        percentage: Number(((item.count / total) * 100).toFixed(1)),
      }));

    return {
      devices: formatList(deviceAgg),
      browsers: formatList(browserAgg),
      operatingSystems: formatList(osAgg),
      countries: formatList(countryAgg),
      referrers: formatList(referrerAgg),
      totalClicks: totalResult,
    };
  }

  /**
   * Retrieves live, granular click event logs including exact raw time, IP, and session ID.
   */
  async getRecentEvents(ownerId: string, filter: AnalyticsQueryFilter, limit = 50) {
    const match = this.buildMatchFilter(ownerId, filter);

    const events = await ClickEvent.find(match)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('link', 'title shortCode originalUrl')
      .lean();

    return events.map((event) => {
      const link = (event.link && typeof event.link === 'object' && !('_id' in event.link && Object.keys(event.link).length === 1)
        ? (event.link as { title?: string; shortCode?: string; originalUrl?: string })
        : {}) as { title?: string; shortCode?: string; originalUrl?: string };

      return {
        _id: String(event._id),
        rawTime: event.timestamp.toISOString(),
        timestamp: event.timestamp,
        ip: event.ip || 'Unknown',
        sessionId: event.sessionId || 'Unknown',
        linkTitle: link.title || 'Untitled Link',
        shortCode: link.shortCode || 'N/A',
        originalUrl: link.originalUrl || '',
        device: event.device || 'unknown',
        browser: event.browser || 'Other',
        os: event.os || 'Other',
        country: event.country || 'Unknown',
        referrer: event.referrer || 'Direct',
        isQr: !!event.isQr,
        isBot: !!event.isBot,
      };
    });
  }

  /**
   * Exports full granular click events as an RFC 4180 compliant CSV stream/string.
   */
  async exportCsv(ownerId: string, filter: AnalyticsQueryFilter): Promise<string> {
    const match = this.buildMatchFilter(ownerId, filter);

    const events = await ClickEvent.find(match)
      .sort({ timestamp: -1 })
      .limit(10000)
      .populate('link', 'title shortCode originalUrl')
      .lean();

    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const header = [
      'Raw Timestamp (UTC)',
      'IP Address',
      'Session ID',
      'Short Code',
      'Link Title',
      'Original Destination',
      'Country',
      'Device',
      'Browser',
      'Operating System',
      'Referrer',
      'Source / QR',
      'Is Automated Bot',
    ].join(',');

    const rows = events.map((event) => {
      const link = (event.link && typeof event.link === 'object' && !('_id' in event.link && Object.keys(event.link).length === 1)
        ? (event.link as { title?: string; shortCode?: string; originalUrl?: string })
        : {}) as { title?: string; shortCode?: string; originalUrl?: string };

      return [
        escapeCsv(new Date(event.timestamp).toISOString()),
        escapeCsv(event.ip || 'Unknown'),
        escapeCsv(event.sessionId || 'Unknown'),
        escapeCsv(link.shortCode || 'N/A'),
        escapeCsv(link.title || 'Untitled Link'),
        escapeCsv(link.originalUrl || 'N/A'),
        escapeCsv(event.country || 'Unknown'),
        escapeCsv(event.device || 'unknown'),
        escapeCsv(event.browser || 'Other'),
        escapeCsv(event.os || 'Other'),
        escapeCsv(event.referrer || 'Direct'),
        escapeCsv(event.isQr ? 'QR Code' : event.source || 'web'),
        escapeCsv(event.isBot ? 'Yes' : 'No'),
      ].join(',');
    });

    return [header, ...rows].join('\r\n');
  }
}

export const analyticsService = new AnalyticsService();
