import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { User, IUserSession } from '../models/User.model.js';
import {
  hashPassword,
  verifyPassword,
  generateRandomToken,
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTemp2faToken,
  verifyTemp2faToken,
} from '../utils/crypto.js';
import {
  generateTotpSecret,
  generateQrCodeDataUrl,
  generateOtpAuthUri,
  verifyTotpToken,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
} from '../utils/totp.util.js';
import { parseBrowserAndOs } from '../utils/analytics.util.js';
import { detectDeviceType } from '../utils/device.util.js';
import { lookupCountry } from '../utils/geo.util.js';
import { emailService } from './email.service.js';
import { activityService } from './activity.service.js';
import { notificationService } from './notification.service.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    isEmailVerified: boolean;
    authProvider: string;
    twoFactorEnabled?: boolean;
    role?: string;
  };
}

export type LoginResult =
  | (AuthTokens & { requires2FA?: false })
  | {
      requires2FA: true;
      tempToken: string;
      user: {
        id: string;
        name: string;
        email: string;
        avatar: string;
        isEmailVerified: boolean;
        authProvider: string;
      };
    };

export class AuthService {
  private buildSession(sessionId: string, userAgent?: string, ipAddress?: string): IUserSession {
    const { browser, os } = parseBrowserAndOs(userAgent);
    const deviceType = detectDeviceType(userAgent);
    const geo = lookupCountry(ipAddress || '127.0.0.1');
    const location = geo.country || 'Unknown';

    return {
      sessionId,
      userAgent,
      ipAddress,
      device: deviceType.charAt(0).toUpperCase() + deviceType.slice(1),
      browser,
      os,
      location,
      createdAt: new Date(),
      lastActive: new Date(),
    };
  }

  async register(
    name: string,
    email: string,
    password: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const passwordHash = await hashPassword(password);
    const { raw: rawToken, hashed: verificationToken } = generateRandomToken(32);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const sessionId = crypto.randomUUID();
    const newSession = this.buildSession(sessionId, userAgent, ipAddress);

    const user = await User.create({
      name,
      email,
      passwordHash,
      authProvider: 'local',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      activeSessions: [newSession],
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
    });

    // Send verification email
    emailService.sendVerificationEmail(user.email, user.name, rawToken).catch(() => {});

    await activityService.logActivity({
      userId: user._id.toString(),
      action: 'LOGIN',
      category: 'auth',
      description: 'Account registered and initial session started',
      ip: ipAddress,
      userAgent,
    }).catch(() => {});

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      sessionId,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      sessionId,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider,
        twoFactorEnabled: user.twoFactorEnabled,
        role: user.role,
      },
    };
  }

  async login(
    email: string,
    password: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<LoginResult> {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.accountStatus !== 'active') {
      throw new AppError('This account is suspended or deactivated.', 403);
    }

    const isValid = await verifyPassword(user.passwordHash, password);
    if (!isValid) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Two-Factor Authentication Check
    if (user.twoFactorEnabled) {
      const tempToken = generateTemp2faToken(user._id.toString());
      return {
        requires2FA: true,
        tempToken,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar || '',
          isEmailVerified: user.isEmailVerified,
          authProvider: user.authProvider,
        },
      };
    }

    const sessionId = crypto.randomUUID();
    const newSession = this.buildSession(sessionId, userAgent, ipAddress);

    // Detect suspicious login from changed IP
    const isSuspicious =
      user.lastLoginIp &&
      ipAddress &&
      user.lastLoginIp !== ipAddress &&
      user.lastLoginIp !== '127.0.0.1' &&
      ipAddress !== '127.0.0.1';

    if (isSuspicious) {
      notificationService.createNotification({
        userId: user._id.toString(),
        type: 'warning',
        title: 'New Login Location Detected',
        message: `Login detected from new IP ${ipAddress} (${newSession.browser} on ${newSession.os}).`,
      }).catch(() => {});
    }

    user.lastLoginAt = new Date();
    if (ipAddress) user.lastLoginIp = ipAddress;
    user.activeSessions = [newSession, ...(user.activeSessions || []).slice(0, 9)];
    await user.save({ validateBeforeSave: false });

    await activityService.logActivity({
      userId: user._id.toString(),
      action: 'LOGIN',
      category: 'auth',
      description: `Successful login (${newSession.browser} on ${newSession.os})`,
      ip: ipAddress,
      userAgent,
      metadata: { suspicious: isSuspicious },
    }).catch(() => {});

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      sessionId,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      sessionId,
    });

    return {
      requires2FA: false,
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider,
        twoFactorEnabled: user.twoFactorEnabled,
        role: user.role,
      },
    };
  }

  async verify2FALogin(
    tempToken: string,
    token?: string,
    recoveryCode?: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    let tempPayload;
    try {
      tempPayload = verifyTemp2faToken(tempToken);
    } catch {
      throw new AppError('2FA login session has expired. Please sign in again.', 401);
    }

    const user = await User.findById(tempPayload.userId).select('+twoFactorSecret +recoveryCodes');
    if (!user || user.accountStatus !== 'active' || !user.twoFactorEnabled) {
      throw new AppError('Invalid authentication request.', 401);
    }

    let verified = false;

    if (token) {
      if (!user.twoFactorSecret) {
        throw new AppError('2FA secret is missing. Please contact support.', 500);
      }
      verified = verifyTotpToken(user.twoFactorSecret, token);
    } else if (recoveryCode) {
      const codes = user.recoveryCodes || [];
      const matchedIdx = codes.findIndex((cHash) => verifyRecoveryCode(recoveryCode, cHash));
      if (matchedIdx !== -1) {
        verified = true;
        // Consume single-use code
        codes.splice(matchedIdx, 1);
        user.recoveryCodes = codes;

        await activityService.logActivity({
          userId: user._id.toString(),
          action: 'LOGIN',
          category: 'security',
          description: `Logged in using single-use 2FA recovery backup code (${codes.length} remaining)`,
          ip: ipAddress,
          userAgent,
        }).catch(() => {});
      }
    }

    if (!verified) {
      throw new AppError('Invalid 2FA code or backup recovery code.', 401);
    }

    const sessionId = crypto.randomUUID();
    const newSession = this.buildSession(sessionId, userAgent, ipAddress);

    user.lastLoginAt = new Date();
    if (ipAddress) user.lastLoginIp = ipAddress;
    user.activeSessions = [newSession, ...(user.activeSessions || []).slice(0, 9)];
    await user.save({ validateBeforeSave: false });

    await activityService.logActivity({
      userId: user._id.toString(),
      action: 'LOGIN',
      category: 'security',
      description: `Two-Factor verification successful (${newSession.browser} on ${newSession.os})`,
      ip: ipAddress,
      userAgent,
    }).catch(() => {});

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      sessionId,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      sessionId,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider,
        twoFactorEnabled: user.twoFactorEnabled,
        role: user.role,
      },
    };
  }

  async setup2FA(userId: string): Promise<{ secret: string; otpauthUrl: string; qrCode: string }> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const secret = generateTotpSecret();
    const otpauthUrl = generateOtpAuthUri({ accountEmail: user.email, secret, issuer: 'BreakIfy' });
    const qrCode = await generateQrCodeDataUrl(otpauthUrl);

    user.twoFactorTempSecret = secret;
    await user.save({ validateBeforeSave: false });

    return { secret, otpauthUrl, qrCode };
  }

  async enable2FA(userId: string, token: string): Promise<{ recoveryCodes: string[] }> {
    const user = await User.findById(userId).select('+twoFactorTempSecret');
    if (!user) throw new AppError('User not found', 404);
    if (!user.twoFactorTempSecret) {
      throw new AppError('2FA setup was not initiated. Please start setup first.', 400);
    }

    const isValid = verifyTotpToken(user.twoFactorTempSecret, token);
    if (!isValid) {
      throw new AppError('Invalid authentication code. Please check your authenticator app and try again.', 400);
    }

    const plainCodes = generateRecoveryCodes(10);
    const hashedCodes = plainCodes.map((c) => hashRecoveryCode(c));

    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = undefined;
    user.twoFactorEnabled = true;
    user.recoveryCodes = hashedCodes;
    await user.save({ validateBeforeSave: false });

    await activityService.logActivity({
      userId: user._id.toString(),
      action: 'SECURITY_UPDATE',
      category: 'security',
      description: 'Two-Factor Authentication (TOTP) was enabled',
    }).catch(() => {});

    await notificationService.createNotification({
      userId: user._id.toString(),
      type: 'success',
      title: 'Two-Factor Authentication Enabled',
      message: 'Two-Factor Authentication is now active on your BreakIfy account.',
    }).catch(() => {});

    return { recoveryCodes: plainCodes };
  }

  async disable2FA(userId: string, password?: string, token?: string): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash +twoFactorSecret');
    if (!user) throw new AppError('User not found', 404);
    if (!user.twoFactorEnabled) {
      throw new AppError('2FA is not currently enabled.', 400);
    }

    let verified = false;
    if (token && user.twoFactorSecret) {
      verified = verifyTotpToken(user.twoFactorSecret, token);
    } else if (password && user.passwordHash) {
      verified = await verifyPassword(user.passwordHash, password);
    }

    if (!verified) {
      throw new AppError('Verification failed. Provide your current password or 6-digit 2FA code.', 401);
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorTempSecret = undefined;
    user.recoveryCodes = [];
    await user.save({ validateBeforeSave: false });

    await activityService.logActivity({
      userId: user._id.toString(),
      action: 'SECURITY_UPDATE',
      category: 'security',
      description: 'Two-Factor Authentication was disabled',
    }).catch(() => {});

    await notificationService.createNotification({
      userId: user._id.toString(),
      type: 'warning',
      title: 'Two-Factor Authentication Disabled',
      message: 'Two-Factor Authentication was disabled on your account.',
    }).catch(() => {});
  }

  async regenerateRecoveryCodes(userId: string, token: string): Promise<{ recoveryCodes: string[] }> {
    const user = await User.findById(userId).select('+twoFactorSecret');
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError('2FA is not enabled on this account.', 400);
    }

    const isValid = verifyTotpToken(user.twoFactorSecret, token);
    if (!isValid) {
      throw new AppError('Invalid 2FA code. Verification required to regenerate recovery codes.', 401);
    }

    const plainCodes = generateRecoveryCodes(10);
    const hashedCodes = plainCodes.map((c) => hashRecoveryCode(c));

    user.recoveryCodes = hashedCodes;
    await user.save({ validateBeforeSave: false });

    await activityService.logActivity({
      userId: user._id.toString(),
      action: 'SECURITY_UPDATE',
      category: 'security',
      description: 'New set of 2FA backup recovery codes generated',
    }).catch(() => {});

    return { recoveryCodes: plainCodes };
  }

  async listSessions(userId: string, currentSessionId?: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    return (user.activeSessions || []).map((s) => ({
      sessionId: s.sessionId,
      device: s.device || 'Desktop',
      browser: s.browser || 'Unknown',
      os: s.os || 'Unknown',
      location: s.location || 'Unknown',
      ipAddress: s.ipAddress || 'Unknown',
      isCurrent: s.sessionId === currentSessionId,
      createdAt: s.createdAt,
      lastActive: s.lastActive,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    user.activeSessions = (user.activeSessions || []).filter((s) => s.sessionId !== sessionId);
    await user.save({ validateBeforeSave: false });

    await activityService.logActivity({
      userId,
      action: 'SECURITY_UPDATE',
      category: 'security',
      description: `Revoked session ${sessionId.slice(0, 8)}...`,
    }).catch(() => {});
  }

  async revokeOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    user.activeSessions = (user.activeSessions || []).filter((s) => s.sessionId === currentSessionId);
    await user.save({ validateBeforeSave: false });

    await activityService.logActivity({
      userId,
      action: 'SECURITY_UPDATE',
      category: 'security',
      description: 'Revoked all other active sessions',
    }).catch(() => {});
  }

  async googleLogin(
    idToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    let payload;
    try {
      if (env.GOOGLE_CLIENT_ID) {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        throw new Error('Google Client ID not configured');
      }
    } catch {
      throw new AppError('Google authentication verification failed.', 401);
    }

    if (!payload || !payload.email) {
      throw new AppError('Google profile does not contain an email.', 400);
    }

    let user = await User.findOne({ email: payload.email.toLowerCase() });
    const sessionId = crypto.randomUUID();
    const newSession = this.buildSession(sessionId, userAgent, ipAddress);

    if (!user) {
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email.toLowerCase(),
        authProvider: 'google',
        googleId: payload.sub,
        avatar: payload.picture || '',
        isEmailVerified: true,
        activeSessions: [newSession],
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      });
    } else {
      if (!user.googleId) {
        user.googleId = payload.sub;
      }
      user.isEmailVerified = true;
      if (!user.avatar && payload.picture) {
        user.avatar = payload.picture;
      }
      user.lastLoginAt = new Date();
      if (ipAddress) user.lastLoginIp = ipAddress;
      user.activeSessions = [newSession, ...user.activeSessions.slice(0, 9)];
      await user.save({ validateBeforeSave: false });
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      sessionId,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      sessionId,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider,
        twoFactorEnabled: user.twoFactorEnabled,
        role: user.role,
      },
    };
  }

  async refreshTokens(refreshTokenStr: string, userAgent?: string, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyRefreshToken(refreshTokenStr);
    const user = await User.findById(payload.userId);

    if (!user || user.accountStatus !== 'active') {
      throw new AppError('Invalid session.', 401);
    }

    const session = (user.activeSessions || []).find((s) => s.sessionId === payload.sessionId);
    if (!session) {
      throw new AppError('Session expired or revoked.', 401);
    }

    session.lastActive = new Date();
    if (userAgent) session.userAgent = userAgent;
    if (ipAddress) session.ipAddress = ipAddress;
    await user.save({ validateBeforeSave: false });

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      sessionId: session.sessionId,
      email: user.email,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user._id.toString(),
      sessionId: session.sessionId,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { activeSessions: { sessionId } },
    });
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const hashedToken = hashToken(rawToken);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      throw new AppError('Verification link is invalid or has expired.', 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
  }

  async resendVerification(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user || user.isEmailVerified) {
      return;
    }

    const { raw: rawToken, hashed: verificationToken } = generateRandomToken(32);
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await emailService.sendVerificationEmail(user.email, user.name, rawToken);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.authProvider === 'google') {
      return;
    }

    const { raw: rawToken, hashed: resetToken } = generateRandomToken(32);
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    await emailService.sendPasswordResetEmail(user.email, user.name, rawToken);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const hashedToken = hashToken(rawToken);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new AppError('Password reset link is invalid or has expired.', 400);
    }

    user.passwordHash = await hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.activeSessions = []; // invalidate all sessions on password reset
    await user.save({ validateBeforeSave: false });

    emailService.sendSecurityNotification(
      user.email,
      user.name,
      'Password Reset Complete',
      'Your account password was successfully reset.'
    ).catch(() => {});
  }
}

export const authService = new AuthService();
