import mongoose from 'mongoose';
import { Link, ILink, LinkStatus, IGeoRule, IDeviceRules, IAbTesting, ILinkHealth } from '../models/Link.model.js';
import { generateShortCode, validateSafeUrl, isValidSlug } from '../utils/url.util.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import { lookupCountry } from '../utils/geo.util.js';
import { detectDeviceType } from '../utils/device.util.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { ClickEvent } from '../models/ClickEvent.model.js';
import { detectBot, generateVisitorHash, normalizeReferrer, parseBrowserAndOs, generateSessionId } from '../utils/analytics.util.js';
import { RECYCLE_BIN_RETENTION_DAYS } from '../config/constants.js';
import { checkDestinationReachability } from '../utils/healthCheck.util.js';
import { generateCsv, parseCsv } from '../utils/csv.util.js';
import { notificationService } from './notification.service.js';
import { activityService } from './activity.service.js';
import { urlSafetyService } from '../utils/urlSafety.util.js';

export interface CreateLinkInput {
  originalUrl: string;
  customSlug?: string;
  title?: string;
  ownerId?: string;
  password?: string;
  startsAt?: Date;
  expiresAt?: Date;
  maxClicks?: number | null;
  geoRules?: IGeoRule[];
  deviceRules?: IDeviceRules;
  abTesting?: IAbTesting;
  tags?: string[];
  notes?: string;
}

export interface ListLinksQuery {
  ownerId: string;
  search?: string;
  status?: string;
  tag?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ResolveRedirectContext {
  ip: string;
  userAgent?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, unknown>;
  sessionId?: string;
}

export type ResolveRedirectResult =
  | { success: true; destinationUrl: string }
  | { success: false; status: number; error: string; isPasswordRequired?: boolean };

export class LinkService {
  async createLink(input: CreateLinkInput): Promise<ILink> {
    const { isValid, normalizedUrl, error } = validateSafeUrl(input.originalUrl);
    if (!isValid || !normalizedUrl) {
      throw new AppError(error || 'Invalid destination URL.', 400);
    }

    const safety = await urlSafetyService.checkUrl(normalizedUrl);
    if (!safety.isSafe) {
      throw new AppError(`Destination URL blocked by safety engine: ${safety.reasons.join(', ')}`, 400);
    }

    let shortCode = input.customSlug?.trim();

    if (shortCode) {
      if (!isValidSlug(shortCode)) {
        throw new AppError('Custom slug is invalid or contains reserved keywords.', 400);
      }

      const existing = await Link.findOne({ shortCode });
      if (existing) {
        throw new AppError(`The short code '${shortCode}' is already taken. Please choose another.`, 409);
      }
    } else {
      let attempts = 0;
      let generated = '';
      while (attempts < 5) {
        generated = generateShortCode(7);
        const collision = await Link.findOne({ shortCode: generated });
        if (!collision) {
          shortCode = generated;
          break;
        }
        attempts++;
      }

      if (!shortCode) {
        throw new AppError('Failed to generate a unique short code. Please try again.', 500);
      }
    }

    let title = input.title?.trim();
    if (!title) {
      try {
        const parsed = new URL(normalizedUrl);
        title = `${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`;
      } catch {
        title = 'Untitled Link';
      }
    }

    let passwordHash: string | undefined;
    let isPasswordProtected = false;

    if (input.password && input.password.trim()) {
      passwordHash = await hashPassword(input.password.trim());
      isPasswordProtected = true;
    }

    const link = await Link.create({
      originalUrl: normalizedUrl,
      shortCode,
      title: title.slice(0, 120),
      owner: input.ownerId ? new mongoose.Types.ObjectId(input.ownerId) : undefined,
      status: 'active',
      isPasswordProtected,
      passwordHash,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      maxClicks: input.maxClicks || undefined,
      geoRules: input.geoRules || [],
      deviceRules: input.deviceRules || {},
      abTesting: input.abTesting || { enabled: false, variants: [] },
      tags: input.tags || [],
      notes: input.notes,
      clicks: 0,
    });

    if (input.ownerId) {
      await activityService.logActivity({
        userId: input.ownerId,
        action: 'LINK_CREATE',
        category: 'link',
        description: `Created short link /${link.shortCode} pointing to ${link.originalUrl}`,
        metadata: { linkId: link._id, shortCode: link.shortCode, originalUrl: link.originalUrl },
      });
    }

    return link;
  }

  async listLinks(query: ListLinksQuery) {
    const { ownerId, search, status, tag, sort = 'newest', page = 1, limit = 10 } = query;

    const filter: mongoose.FilterQuery<ILink> = {
      owner: new mongoose.Types.ObjectId(ownerId),
      isDeleted: { $ne: true },
    };

    if (status && status !== 'all') {
      filter.status = status as LinkStatus;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { shortCode: searchRegex },
        { originalUrl: searchRegex },
        { tags: searchRegex },
      ];
    }

    const sortOptions: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      case 'most-clicks':
      case 'clicks':
        sortOptions.clicks = -1;
        break;
      case 'least-clicks':
        sortOptions.clicks = 1;
        break;
      case 'title':
        sortOptions.title = 1;
        break;
      case 'newest':
      default:
        sortOptions.createdAt = -1;
        break;
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [links, total] = await Promise.all([
      Link.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      Link.countDocuments(filter),
    ]);

    return {
      links,
      pagination: {
        page: Math.max(1, page),
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getLinkById(id: string, ownerId: string, allowDeleted: boolean = false): Promise<ILink> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid link ID format.', 400);
    }

    const link = await Link.findById(id);
    if (!link) {
      throw new AppError('Link not found.', 404);
    }

    if (!link.owner || link.owner.toString() !== ownerId) {
      throw new AppError('You do not have permission to view this link.', 403);
    }

    if (link.isDeleted && !allowDeleted) {
      throw new AppError('This link has been moved to the recycle bin.', 404);
    }

    return link;
  }

  async updateLink(
    id: string,
    ownerId: string,
    updates: Partial<ILink> & { password?: string; removePassword?: boolean }
  ): Promise<ILink> {
    const link = await this.getLinkById(id, ownerId);

    if (updates.originalUrl !== undefined) {
      const { isValid, normalizedUrl, error } = validateSafeUrl(updates.originalUrl);
      if (!isValid || !normalizedUrl) {
        throw new AppError(error || 'Invalid destination URL.', 400);
      }
      const safety = await urlSafetyService.checkUrl(normalizedUrl);
      if (!safety.isSafe) {
        throw new AppError(`Destination URL blocked by safety engine: ${safety.reasons.join(', ')}`, 400);
      }
      link.originalUrl = normalizedUrl;
    }

    if (updates.title !== undefined) link.title = updates.title;
    if (updates.status !== undefined) link.status = updates.status;
    if (updates.startsAt !== undefined) link.startsAt = updates.startsAt;
    if (updates.expiresAt !== undefined) link.expiresAt = updates.expiresAt;
    if (updates.maxClicks !== undefined) link.maxClicks = updates.maxClicks || undefined;
    if (updates.geoRules !== undefined) link.geoRules = updates.geoRules;
    if (updates.deviceRules !== undefined) link.deviceRules = updates.deviceRules;
    if (updates.abTesting !== undefined) link.abTesting = updates.abTesting;
    if (updates.tags !== undefined) link.tags = updates.tags;
    if (updates.notes !== undefined) link.notes = updates.notes;

    if (updates.removePassword) {
      link.isPasswordProtected = false;
      link.passwordHash = undefined;
    } else if (updates.password && updates.password.trim()) {
      link.passwordHash = await hashPassword(updates.password.trim());
      link.isPasswordProtected = true;
    }

    if (updates.originalUrl) {
      const { isValid, normalizedUrl, error } = validateSafeUrl(updates.originalUrl);
      if (!isValid || !normalizedUrl) {
        throw new AppError(error || 'Invalid destination URL.', 400);
      }
      link.originalUrl = normalizedUrl;
    }

    await link.save();

    await activityService.logActivity({
      userId: ownerId,
      action: 'LINK_UPDATE',
      category: 'link',
      description: `Updated short link /${link.shortCode}`,
      metadata: { linkId: link._id, shortCode: link.shortCode },
    });

    return link;
  }

  /**
   * Moves a link to the Recycle Bin (soft delete).
   */
  async deleteLink(id: string, ownerId: string): Promise<ILink> {
    const link = await this.getLinkById(id, ownerId);
    link.isDeleted = true;
    link.deletedAt = new Date();
    await link.save();

    await activityService.logActivity({
      userId: ownerId,
      action: 'LINK_DELETE',
      category: 'link',
      description: `Moved short link /${link.shortCode} to recycle bin`,
      metadata: { linkId: link._id, shortCode: link.shortCode, title: link.title },
    });

    return link;
  }

  /**
   * Fetches deleted links currently in the Recycle Bin with remaining retention days.
   */
  async getRecycleBin(
    ownerId: string,
    query: { search?: string; sort?: string; page?: number; limit?: number } = {}
  ): Promise<{
    links: Array<Record<string, unknown> & { retentionDaysRemaining: number }>;
    retentionDaysConfigured: number;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));

    const filter: mongoose.FilterQuery<ILink> = {
      owner: new mongoose.Types.ObjectId(ownerId),
      isDeleted: true,
    };

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { shortCode: searchRegex },
        { originalUrl: searchRegex },
      ];
    }

    const sortOptions: Record<string, 1 | -1> =
      query.sort === 'oldest' ? { deletedAt: 1 } : { deletedAt: -1 };

    const skip = (page - 1) * limit;

    const [links, total] = await Promise.all([
      Link.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      Link.countDocuments(filter),
    ]);

    const now = Date.now();
    const enrichedLinks = (links as unknown as ILink[]).map((link) => {
      const deletedTime = link.deletedAt ? new Date(link.deletedAt).getTime() : now;
      const daysSinceDeletion = Math.floor((now - deletedTime) / (1000 * 60 * 60 * 24));
      const retentionDaysRemaining = Math.max(0, RECYCLE_BIN_RETENTION_DAYS - daysSinceDeletion);

      return {
        ...link,
        retentionDaysRemaining,
      };
    });

    return {
      links: enrichedLinks,
      retentionDaysConfigured: RECYCLE_BIN_RETENTION_DAYS,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Restores a deleted link from the Recycle Bin.
   */
  async restoreLink(id: string, ownerId: string): Promise<ILink> {
    const link = await this.getLinkById(id, ownerId, true);
    if (!link.isDeleted) {
      throw new AppError('This link is not in the recycle bin.', 400);
    }

    link.isDeleted = false;
    link.deletedAt = undefined;
    await link.save();

    await activityService.logActivity({
      userId: ownerId,
      action: 'LINK_RESTORE',
      category: 'link',
      description: `Restored short link /${link.shortCode} from recycle bin`,
      metadata: { linkId: link._id, shortCode: link.shortCode, originalUrl: link.originalUrl },
    });

    return link;
  }

  /**
   * Irreversibly purges a single link from the database.
   */
  async permanentDeleteLink(id: string, ownerId: string): Promise<void> {
    const link = await this.getLinkById(id, ownerId, true);
    await Link.deleteOne({ _id: link._id });

    await activityService.logActivity({
      userId: ownerId,
      action: 'LINK_PERMANENT_DELETE',
      category: 'link',
      description: `Permanently deleted short link /${link.shortCode}`,
      metadata: { shortCode: link.shortCode, title: link.title },
    });
  }

  /**
   * Purges all deleted links in the recycle bin for this user.
   */
  async emptyRecycleBin(ownerId: string): Promise<{ deletedCount: number }> {
    const result = await Link.deleteMany({
      owner: new mongoose.Types.ObjectId(ownerId),
      isDeleted: true,
    });

    await activityService.logActivity({
      userId: ownerId,
      action: 'RECYCLE_BIN_EMPTY',
      category: 'link',
      description: `Emptied recycle bin (${result.deletedCount || 0} links purged)`,
      metadata: { count: result.deletedCount },
    });

    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * Restores multiple links from the recycle bin in bulk.
   */
  async bulkRestoreLinks(ownerId: string, linkIds: string[]): Promise<{ affectedCount: number }> {
    const filter = {
      _id: { $in: linkIds.map((id) => new mongoose.Types.ObjectId(id)) },
      owner: new mongoose.Types.ObjectId(ownerId),
      isDeleted: true,
    };

    const result = await Link.updateMany(filter, {
      $set: { isDeleted: false },
      $unset: { deletedAt: 1 },
    });

    await activityService.logActivity({
      userId: ownerId,
      action: 'LINK_RESTORE',
      category: 'link',
      description: `Bulk restored ${result.modifiedCount || 0} links from recycle bin`,
      metadata: { count: result.modifiedCount, linkIds },
    });

    return { affectedCount: result.modifiedCount || 0 };
  }

  /**
   * Permanently deletes multiple links from the recycle bin in bulk.
   */
  async bulkPermanentDeleteLinks(ownerId: string, linkIds: string[]): Promise<{ deletedCount: number }> {
    const filter = {
      _id: { $in: linkIds.map((id) => new mongoose.Types.ObjectId(id)) },
      owner: new mongoose.Types.ObjectId(ownerId),
      isDeleted: true,
    };

    const result = await Link.deleteMany(filter);

    await activityService.logActivity({
      userId: ownerId,
      action: 'LINK_PERMANENT_DELETE',
      category: 'link',
      description: `Bulk permanently deleted ${result.deletedCount || 0} links from recycle bin`,
      metadata: { count: result.deletedCount, linkIds },
    });

    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * Checks whether the destination URL of a link is healthy and reachable.
   */
  async checkLinkHealth(id: string, ownerId: string): Promise<ILinkHealth> {
    const link = await this.getLinkById(id, ownerId);
    const healthResult = await checkDestinationReachability(link.originalUrl);

    link.healthStatus = {
      isReachable: healthResult.reachable,
      statusCode: healthResult.statusCode,
      responseTimeMs: healthResult.responseTimeMs,
      error: healthResult.error,
      lastCheckedAt: new Date(),
    };
    await link.save();

    if (!healthResult.reachable) {
      await notificationService.createNotification({
        userId: ownerId,
        title: `Link Health Warning: ${link.title}`,
        message: `Destination URL (${link.originalUrl}) returned: ${healthResult.error || 'Server error'}.`,
        type: 'warning',
        link: '/my-links',
      });
    }

    return link.healthStatus;
  }

  /**
   * Generates a CSV export containing all active user links.
   */
  async exportLinksCsv(ownerId: string): Promise<string> {
    const links = await Link.find({
      owner: new mongoose.Types.ObjectId(ownerId),
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = links.map((l) => ({
      title: l.title,
      originalUrl: l.originalUrl,
      shortUrl: `https://breakify.site/${l.shortCode}`,
      shortCode: l.shortCode,
      status: l.status,
      clicks: l.clicks,
      qrScans: l.qrScans,
      tags: (l.tags || []).join(', '),
      createdAt: new Date(l.createdAt).toISOString(),
      notes: l.notes || '',
    }));

    return generateCsv(formatted, [
      { key: 'title', header: 'Title' },
      { key: 'originalUrl', header: 'Destination URL' },
      { key: 'shortUrl', header: 'Short URL' },
      { key: 'shortCode', header: 'Short Code' },
      { key: 'status', header: 'Status' },
      { key: 'clicks', header: 'Clicks' },
      { key: 'qrScans', header: 'QR Scans' },
      { key: 'tags', header: 'Tags' },
      { key: 'createdAt', header: 'Created Date (UTC)' },
      { key: 'notes', header: 'Notes' },
    ]);
  }

  /**
   * Imports links from a CSV text payload with thorough row-level validation.
   */
  async importLinksCsv(
    ownerId: string,
    csvContent: string
  ): Promise<{
    totalRows: number;
    importedCount: number;
    failedCount: number;
    errors: Array<{ row: number; error: string; rawData: Record<string, string> }>;
  }> {
    const parsed = parseCsv(csvContent);
    const errors: Array<{ row: number; error: string; rawData: Record<string, string> }> = [];
    let importedCount = 0;

    for (const row of parsed.rows) {
      const destination =
        row.data['destination url'] ||
        row.data['destinationurl'] ||
        row.data['original url'] ||
        row.data['originalurl'] ||
        row.data['url'] ||
        row.data['destination'] ||
        '';

      if (!destination) {
        errors.push({
          row: row.rowNumber,
          error: "Missing required 'Destination URL' or 'Original URL' column value.",
          rawData: row.data,
        });
        continue;
      }

      const { isValid, normalizedUrl, error: urlError } = validateSafeUrl(destination);
      if (!isValid || !normalizedUrl) {
        errors.push({
          row: row.rowNumber,
          error: `Invalid URL: ${urlError || 'Malformed URL format'}`,
          rawData: row.data,
        });
        continue;
      }

      const safety = await urlSafetyService.checkUrl(normalizedUrl);
      if (!safety.isSafe) {
        errors.push({
          row: row.rowNumber,
          error: `URL blocked by safety engine: ${safety.reasons.join(', ')}`,
          rawData: row.data,
        });
        continue;
      }

      const title = row.data['title'] || undefined;
      const customSlug =
        row.data['short code'] ||
        row.data['shortcode'] ||
        row.data['slug'] ||
        row.data['custom slug'] ||
        undefined;
      const tagsStr = row.data['tags'] || '';
      const tags = tagsStr
        ? tagsStr
            .split(/[,;]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const notes = row.data['notes'] || undefined;

      try {
        await this.createLink({
          originalUrl: normalizedUrl,
          title,
          customSlug: customSlug ? customSlug.trim() : undefined,
          tags,
          notes,
          ownerId,
        });
        importedCount++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to import row';
        errors.push({
          row: row.rowNumber,
          error: msg,
          rawData: row.data,
        });
      }
    }

    await activityService.logActivity({
      userId: ownerId,
      action: 'CSV_IMPORT',
      category: 'link',
      description: `Imported ${importedCount} links via CSV (${errors.length} failed)`,
      metadata: { totalRows: parsed.totalRows, importedCount, failedCount: errors.length },
    });

    await notificationService.createNotification({
      userId: ownerId,
      title: 'CSV Import Completed',
      message: `Successfully imported ${importedCount} links. ${errors.length > 0 ? `${errors.length} rows failed validation.` : 'All rows succeeded!'}`,
      type: errors.length > 0 ? 'warning' : 'success',
      link: '/my-links',
    });

    return {
      totalRows: parsed.totalRows,
      importedCount,
      failedCount: errors.length,
      errors,
    };
  }

  async bulkActions(
    ownerId: string,
    linkIds: string[],
    action: 'delete' | 'activate' | 'deactivate' | 'archive' | 'add-tag',
    tag?: string
  ): Promise<{ affectedCount: number }> {
    const filter = {
      _id: { $in: linkIds.map((id) => new mongoose.Types.ObjectId(id)) },
      owner: new mongoose.Types.ObjectId(ownerId),
      isDeleted: { $ne: true },
    };

    let result;

    switch (action) {
      case 'delete':
        result = await Link.updateMany(filter, {
          $set: { isDeleted: true, deletedAt: new Date() },
        });
        await activityService.logActivity({
          userId: ownerId,
          action: 'LINK_DELETE',
          category: 'link',
          description: `Bulk moved ${result.modifiedCount || 0} links to recycle bin`,
          metadata: { count: result.modifiedCount, linkIds },
        });
        return { affectedCount: result.modifiedCount || 0 };

      case 'activate':
        result = await Link.updateMany(filter, { $set: { status: 'active' } });
        return { affectedCount: result.modifiedCount || 0 };

      case 'deactivate':
        result = await Link.updateMany(filter, { $set: { status: 'inactive' } });
        return { affectedCount: result.modifiedCount || 0 };

      case 'archive':
        result = await Link.updateMany(filter, { $set: { status: 'archived' } });
        return { affectedCount: result.modifiedCount || 0 };

      case 'add-tag':
        if (!tag || !tag.trim()) {
          throw new AppError('Tag is required for add-tag bulk action.', 400);
        }
        result = await Link.updateMany(filter, { $addToSet: { tags: tag.trim() } });
        return { affectedCount: result.modifiedCount || 0 };

      default:
        throw new AppError('Unsupported bulk action.', 400);
    }
  }

  /**
   * Evaluates active routing rules (Scheduled activation, Expiration, Click limits,
   * Password lock, Geo routing, Device routing, A/B Testing).
   */
  async resolveRedirect(shortCode: string, ctx: ResolveRedirectContext): Promise<ResolveRedirectResult> {
    const link = await Link.findOne({ shortCode });

    if (!link) {
      return { success: false, status: 404, error: 'Short link not found.' };
    }

    if (link.isDeleted) {
      return { success: false, status: 404, error: 'This short link has been moved to the recycle bin.' };
    }

    if (link.status === 'inactive') {
      return { success: false, status: 410, error: 'This short link has been disabled by its owner.' };
    }

    if (link.status === 'archived') {
      return { success: false, status: 410, error: 'This short link has been archived.' };
    }

    const now = Date.now();

    // 1. Scheduled activation check
    if (link.startsAt && new Date(link.startsAt).getTime() > now) {
      return {
        success: false,
        status: 403,
        error: `This link is scheduled to activate on ${new Date(link.startsAt).toUTCString()}.`,
      };
    }

    // 2. Expiration check
    if (link.expiresAt && new Date(link.expiresAt).getTime() < now) {
      return { success: false, status: 410, error: 'This short link has expired.' };
    }

    // 3. Password protection check
    if (link.isPasswordProtected) {
      return {
        success: false,
        status: 401,
        isPasswordRequired: true,
        error: 'Password required to access this destination.',
      };
    }

    const isQr = ctx.query?.src === 'qr' || ctx.query?.ref === 'qr';
    const incFields: Record<string, number> = { clicks: 1 };
    if (isQr) {
      incFields.qrScans = 1;
    }

    // 4. Click limit check (atomic check-and-increment to avoid race condition)
    if (link.maxClicks && link.maxClicks > 0) {
      const updated = await Link.findOneAndUpdate(
        { _id: link._id, clicks: { $lt: link.maxClicks } },
        {
          $inc: incFields,
          $set: { lastClickedAt: new Date() },
        }
      );

      if (!updated) {
        return {
          success: false,
          status: 410,
          error: 'This link has reached its maximum configured click limit.',
        };
      }
    } else {
      // Standard non-blocking click tracking
      Link.updateOne(
        { _id: link._id },
        {
          $inc: incFields,
          $set: { lastClickedAt: new Date() },
        }
      ).catch((err) => {
        logger.error(`Failed to record click for ${shortCode}:`, err);
      });
    }

    // Record granular telemetry asynchronously
    this.recordClickTelemetry(link, ctx);

    // 5. Smart Routing Resolution (A/B Testing, Geo, Device, Fallback)
    const destinationUrl = this.selectDestinationUrl(link, ctx);

    return { success: true, destinationUrl };
  }

  /**
   * Verifies password for password-protected links.
   */
  async verifyPasswordAndResolve(
    shortCode: string,
    candidatePass: string,
    ctx: ResolveRedirectContext
  ): Promise<ResolveRedirectResult> {
    const link = await Link.findOne({ shortCode }).select('+passwordHash');
    if (!link) {
      return { success: false, status: 404, error: 'Link not found.' };
    }

    if (!link.isPasswordProtected || !link.passwordHash) {
      return this.resolveRedirect(shortCode, ctx);
    }

    const isMatch = await verifyPassword(link.passwordHash, candidatePass);
    if (!isMatch) {
      return {
        success: false,
        status: 401,
        isPasswordRequired: true,
        error: 'Incorrect password. Access denied.',
      };
    }

    // Enforce link status, schedule, expiration, and click limits after authentication
    if (link.status === 'inactive') {
      return { success: false, status: 410, error: 'This short link has been disabled by its owner.' };
    }

    if (link.status === 'archived') {
      return { success: false, status: 410, error: 'This short link has been archived.' };
    }

    const now = Date.now();
    if (link.startsAt && new Date(link.startsAt).getTime() > now) {
      return {
        success: false,
        status: 403,
        error: `This link is scheduled to activate on ${new Date(link.startsAt).toUTCString()}.`,
      };
    }

    if (link.expiresAt && new Date(link.expiresAt).getTime() < now) {
      return { success: false, status: 410, error: 'This short link has expired.' };
    }

    const isQr = ctx.query?.src === 'qr' || ctx.query?.ref === 'qr';
    const incFields: Record<string, number> = { clicks: 1 };
    if (isQr) {
      incFields.qrScans = 1;
    }

    if (link.maxClicks && link.maxClicks > 0) {
      const updated = await Link.findOneAndUpdate(
        { _id: link._id, clicks: { $lt: link.maxClicks } },
        {
          $inc: incFields,
          $set: { lastClickedAt: new Date() },
        }
      );

      if (!updated) {
        return {
          success: false,
          status: 410,
          error: 'This link has reached its maximum configured click limit.',
        };
      }
    } else {
      Link.updateOne(
        { _id: link._id },
        {
          $inc: incFields,
          $set: { lastClickedAt: new Date() },
        }
      ).catch(() => {});
    }

    // Record granular telemetry asynchronously
    this.recordClickTelemetry(link, ctx);

    const destinationUrl = this.selectDestinationUrl(link, ctx);
    return { success: true, destinationUrl };
  }

  private recordClickTelemetry(link: ILink, ctx: ResolveRedirectContext): void {
    if (!link.owner) return;

    try {
      const isQr = ctx.query?.src === 'qr' || ctx.query?.ref === 'qr';
      const isBot = detectBot(ctx.userAgent);
      const visitorHash = generateVisitorHash(ctx.ip, ctx.userAgent);
      const rawReferer = (ctx.headers?.referer || ctx.headers?.referrer) as string | undefined;
      const referrer = normalizeReferrer(rawReferer);
      const geo = lookupCountry(ctx.ip, ctx.headers);
      const device = detectDeviceType(ctx.userAgent);
      const { browser, os } = parseBrowserAndOs(ctx.userAgent);

      let source = 'web';
      if (isQr) {
        source = 'qr';
      } else if (ctx.query?.utm_source) {
        source = String(ctx.query.utm_source).slice(0, 50);
      }

      ClickEvent.create({
        link: link._id,
        owner: link.owner,
        timestamp: new Date(),
        ip: ctx.ip || '127.0.0.1',
        sessionId: ctx.sessionId || generateSessionId(),
        visitorHash,
        referrer,
        country: geo.country || 'Unknown',
        device,
        browser,
        os,
        isQr,
        source,
        isBot,
      }).catch((err) => {
        logger.error(`Failed to record ClickEvent for ${link.shortCode}:`, err);
      });
    } catch (err) {
      logger.error('Error dispatching click telemetry:', err);
    }
  }

  private selectDestinationUrl(link: ILink, ctx: ResolveRedirectContext): string {
    let resolvedUrl = link.originalUrl;

    // A/B Testing resolution (highest precedence if enabled)
    if (link.abTesting && link.abTesting.enabled && link.abTesting.variants.length > 0) {
      const variant = this.selectAbVariant(link, ctx.ip);
      if (variant && variant.destinationUrl) {
        // Record variant-specific click asynchronously
        Link.updateOne(
          { _id: link._id, 'abTesting.variants.id': variant.id },
          { $inc: { 'abTesting.variants.$.clicks': 1 } }
        ).catch(() => {});
        resolvedUrl = variant.destinationUrl;
      }
    } else if (link.geoRules && link.geoRules.length > 0) {
      // Geo-based routing resolution
      const geo = lookupCountry(ctx.ip, ctx.headers);
      if (geo.country) {
        const matched = link.geoRules.find((r) => r.countryCode.toUpperCase() === geo.country);
        if (matched && matched.destinationUrl) {
          resolvedUrl = matched.destinationUrl;
        }
      }
    } else if (link.deviceRules) {
      // Device-based routing resolution
      const deviceType = detectDeviceType(ctx.userAgent);
      const deviceUrl = link.deviceRules[deviceType];
      if (deviceUrl && deviceUrl.trim()) {
        resolvedUrl = deviceUrl.trim();
      }
    }

    // CRLF injection defense & safety scheme normalization
    const cleanUrl = resolvedUrl.replace(/[\r\n]/g, '').trim();
    const { isValid, normalizedUrl } = validateSafeUrl(cleanUrl);
    return isValid && normalizedUrl ? normalizedUrl : link.originalUrl.replace(/[\r\n]/g, '').trim();
  }

  private selectAbVariant(link: ILink, seedKey: string) {
    const variants = link.abTesting.variants;
    if (variants.length === 0) return null;

    const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);
    if (totalWeight <= 0) return variants[0];

    // Compute consistent hash bucket (0 to totalWeight) based on client seed
    let hash = 0;
    for (let i = 0; i < seedKey.length; i++) {
      hash = (hash * 31 + seedKey.charCodeAt(i)) >>> 0;
    }
    const target = hash % totalWeight;

    let cursor = 0;
    for (const v of variants) {
      cursor += v.weight || 1;
      if (target < cursor) {
        return v;
      }
    }

    return variants[0];
  }
}

export const linkService = new LinkService();
