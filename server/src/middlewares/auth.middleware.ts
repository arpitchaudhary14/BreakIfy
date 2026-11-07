import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/crypto.js';
import { User } from '../models/User.model.js';
import { AppError } from '../utils/AppError.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Authentication required. Please sign in.', 401);
    }

    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401);
    }

    if (user.accountStatus !== 'active') {
      throw new AppError('Your account has been deactivated or suspended.', 403);
    }

    // Verify session validity
    const session = (user.activeSessions || []).find((s) => s.sessionId === payload.sessionId);
    if (!session) {
      throw new AppError('Session has expired or was revoked. Please sign in again.', 401);
    }

    // Update lastActive timestamp (if older than 2 minutes)
    const now = new Date();
    if (now.getTime() - new Date(session.lastActive).getTime() > 2 * 60 * 1000) {
      session.lastActive = now;
      user.save({ validateBeforeSave: false }).catch(() => {});
    }

    req.user = user;
    req.session = session;
    req.sessionId = payload.sessionId;
    next();
  } catch (error: unknown) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired authentication token.', 401));
    }
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId);

    if (user && user.accountStatus === 'active') {
      const session = (user.activeSessions || []).find((s) => s.sessionId === payload.sessionId);
      if (session) {
        req.user = user;
        req.session = session;
        req.sessionId = payload.sessionId;
      }
    }
    next();
  } catch {
    next();
  }
}

