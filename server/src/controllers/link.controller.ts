import { Request, Response, NextFunction } from 'express';
import { linkService } from '../services/link.service.js';
import { generateSessionId } from '../utils/analytics.util.js';

export class LinkController {
  async createLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        originalUrl,
        customSlug,
        title,
        password,
        startsAt,
        expiresAt,
        maxClicks,
        geoRules,
        deviceRules,
        abTesting,
        tags,
        notes,
      } = req.body;

      const ownerId = req.user ? req.user._id.toString() : undefined;

      const link = await linkService.createLink({
        originalUrl,
        customSlug,
        title,
        ownerId,
        password,
        startsAt,
        expiresAt,
        maxClicks,
        geoRules,
        deviceRules,
        abTesting,
        tags,
        notes,
      });

      res.status(201).json({
        success: true,
        data: { link },
      });
    } catch (error) {
      next(error);
    }
  }

  async listLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const { search, status, tag, sort, page, limit } = req.query;

      const result = await linkService.listLinks({
        ownerId,
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        tag: tag ? String(tag) : undefined,
        sort: sort ? String(sort) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 10,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const link = await linkService.getLinkById(req.params.id, ownerId);

      res.status(200).json({
        success: true,
        data: { link },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const updated = await linkService.updateLink(req.params.id, ownerId, req.body);

      res.status(200).json({
        success: true,
        data: { link: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const link = await linkService.deleteLink(req.params.id, ownerId);

      res.status(200).json({
        success: true,
        data: { message: 'Link moved to recycle bin.', link },
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecycleBin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const { search, sort, page, limit } = req.query;

      const result = await linkService.getRecycleBin(ownerId, {
        search: search ? String(search) : undefined,
        sort: sort ? String(sort) : undefined,
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 10,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const link = await linkService.restoreLink(req.params.id, ownerId);

      res.status(200).json({
        success: true,
        data: { message: 'Link restored successfully.', link },
      });
    } catch (error) {
      next(error);
    }
  }

  async permanentDeleteLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      await linkService.permanentDeleteLink(req.params.id, ownerId);

      res.status(200).json({
        success: true,
        data: { message: 'Link permanently deleted.' },
      });
    } catch (error) {
      next(error);
    }
  }

  async emptyRecycleBin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const result = await linkService.emptyRecycleBin(ownerId);

      res.status(200).json({
        success: true,
        data: {
          message: 'Recycle bin emptied.',
          deletedCount: result.deletedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkRestore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const { linkIds } = req.body;

      if (!Array.isArray(linkIds)) {
        res.status(400).json({ success: false, error: { message: 'Array of linkIds required.' } });
        return;
      }

      const result = await linkService.bulkRestoreLinks(ownerId, linkIds);

      res.status(200).json({
        success: true,
        data: {
          message: `${result.affectedCount} link(s) restored.`,
          affectedCount: result.affectedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkPermanentDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const { linkIds } = req.body;

      if (!Array.isArray(linkIds)) {
        res.status(400).json({ success: false, error: { message: 'Array of linkIds required.' } });
        return;
      }

      const result = await linkService.bulkPermanentDeleteLinks(ownerId, linkIds);

      res.status(200).json({
        success: true,
        data: {
          message: `${result.deletedCount} link(s) permanently deleted.`,
          deletedCount: result.deletedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async checkLinkHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const health = await linkService.checkLinkHealth(req.params.id, ownerId);

      res.status(200).json({
        success: true,
        data: { health },
      });
    } catch (error) {
      next(error);
    }
  }

  async exportLinksCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const csv = await linkService.exportLinksCsv(ownerId);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="breakify-links.csv"');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }

  async importLinksCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const { csvContent } = req.body;

      if (!csvContent || typeof csvContent !== 'string') {
        res.status(400).json({
          success: false,
          error: { message: 'Missing csvContent string in request body.' },
        });
        return;
      }

      const result = await linkService.importLinksCsv(ownerId, csvContent);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkActions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.user!._id.toString();
      const { linkIds, action, tag } = req.body;

      const result = await linkService.bulkActions(ownerId, linkIds, action, tag);

      res.status(200).json({
        success: true,
        data: {
          message: `Bulk ${action} completed successfully.`,
          affectedCount: result.affectedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async handleRedirect(req: Request, res: Response): Promise<void> {
    const { shortCode } = req.params;
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.ip || req.socket.remoteAddress || '127.0.0.1');

    let sessionId = req.cookies?.bk_sid;
    if (!sessionId) {
      sessionId = generateSessionId();
      res.cookie('bk_sid', sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
      });
    }

    const ctx = {
      ip: clientIp,
      userAgent: req.headers['user-agent'],
      headers: req.headers,
      query: req.query as Record<string, unknown>,
      sessionId,
    };

    const result = await linkService.resolveRedirect(shortCode, ctx);

    if (result.success) {
      res.redirect(302, result.destinationUrl);
      return;
    }

    // Password Gate UI
    if (result.isPasswordRequired) {
      if (req.headers.accept?.includes('application/json')) {
        res.status(401).json({
          success: false,
          error: { message: result.error, isPasswordRequired: true },
        });
        return;
      }

      res.status(401).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Protected Link — BreakIfy</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { background: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
              .card { background: #121214; border: 1px solid #27272a; border-radius: 12px; padding: 36px 32px; max-width: 400px; width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
              .logo { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 20px; text-align: center; }
              h1 { font-size: 18px; font-weight: 600; margin: 0 0 8px; color: #ffffff; text-align: center; }
              p { font-size: 13px; color: #a1a1aa; line-height: 1.5; margin: 0 0 24px; text-align: center; }
              input { width: 100%; padding: 10px 12px; background: #18181b; border: 1px solid #27272a; border-radius: 8px; color: #fff; font-size: 14px; margin-bottom: 16px; box-sizing: border-box; outline: none; }
              input:focus { border-color: #71717a; }
              button { width: 100%; background: #ffffff; color: #09090b; border: none; font-size: 13px; font-weight: 600; padding: 11px; border-radius: 8px; cursor: pointer; }
              button:hover { background: #e4e4e7; }
              .footer { text-align: center; font-size: 11px; color: #52525b; margin-top: 24px; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="logo">Break<span style="color:#a1a1aa;">Ify</span></div>
              <h1>Password Protected</h1>
              <p>This short link requires a passkey to access.</p>
              <form method="POST" action="/${shortCode}/verify-password">
                <input type="password" name="password" required placeholder="Enter link password" autofocus />
                <button type="submit">Unlock & Continue</button>
              </form>
              <div class="footer">Encrypted & Protected by BreakIfy</div>
            </div>
          </body>
        </html>
      `);
      return;
    }

    // Generic status page (Expired, Scheduled, Click limit reached, Inactive)
    res.status(result.status).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Link Unavailable — BreakIfy</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { background: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #121214; border: 1px solid #27272a; border-radius: 12px; padding: 36px 32px; max-width: 440px; text-align: center; }
            h1 { font-size: 20px; font-weight: 700; margin: 0 0 10px; color: #ffffff; }
            p { font-size: 13px; color: #a1a1aa; line-height: 1.6; margin: 0 0 24px; }
            a { display: inline-block; background: #ffffff; color: #09090b; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 8px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #27272a; color: #d4d4d8; margin-bottom: 16px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">HTTP ${result.status}</div>
            <h1>Link Unavailable</h1>
            <p>${result.error}</p>
            <a href="/">Go to BreakIfy</a>
          </div>
        </body>
      </html>
    `);
  }

  async verifyPassword(req: Request, res: Response): Promise<void> {
    const { shortCode } = req.params;
    const password = req.body.password;
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.ip || req.socket.remoteAddress || '127.0.0.1');

    let sessionId = req.cookies?.bk_sid;
    if (!sessionId) {
      sessionId = generateSessionId();
      res.cookie('bk_sid', sessionId, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
      });
    }

    const ctx = {
      ip: clientIp,
      userAgent: req.headers['user-agent'],
      headers: req.headers,
      query: req.query as Record<string, unknown>,
      sessionId,
    };

    const result = await linkService.verifyPasswordAndResolve(shortCode, password, ctx);

    if (result.success) {
      if (req.headers.accept?.includes('application/json')) {
        res.status(200).json({ success: true, data: { destinationUrl: result.destinationUrl } });
      } else {
        res.redirect(302, result.destinationUrl);
      }
      return;
    }

    if (req.headers.accept?.includes('application/json')) {
      res.status(result.status).json({ success: false, error: { message: result.error } });
    } else {
      res.status(result.status).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Access Denied — BreakIfy</title>
            <style>
              body { background: #09090b; color: #f4f4f5; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
              .card { background: #121214; border: 1px solid #ef4444; border-radius: 12px; padding: 32px; max-width: 380px; text-align: center; }
              h1 { font-size: 18px; color: #ef4444; margin-bottom: 8px; }
              p { font-size: 13px; color: #a1a1aa; margin-bottom: 20px; }
              a { display: inline-block; background: #27272a; color: #fff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Access Denied</h1>
              <p>${result.error}</p>
              <a href="/${shortCode}">Try Again</a>
            </div>
          </body>
        </html>
      `);
    }
  }
}

export const linkController = new LinkController();
