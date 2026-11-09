import { User } from '../models/User.model.js';
import { Link } from '../models/Link.model.js';
import { ActivityLog } from '../models/ActivityLog.model.js';
import { Notification } from '../models/Notification.model.js';
import {
  hashPassword,
  verifyPassword,
  generateRandomToken,
  hashToken,
} from '../utils/crypto.js';
import { emailService } from './email.service.js';
import { AppError } from '../utils/AppError.js';

export class UserService {
  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      isEmailVerified: user.isEmailVerified,
      authProvider: user.authProvider,
      pendingEmail: user.pendingEmail,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (data.name !== undefined) user.name = data.name;
    if (data.avatar !== undefined) user.avatar = data.avatar;

    await user.save();
    return this.getProfile(userId);
  }

  async changePassword(userId: string, currentPass: string, newPass: string): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (user.authProvider === 'google' && !user.passwordHash) {
      throw new AppError('This account was created with Google OAuth and has no password.', 400);
    }

    const isValid = await verifyPassword(user.passwordHash || '', currentPass);
    if (!isValid) {
      throw new AppError('Current password is incorrect.', 400);
    }

    user.passwordHash = await hashPassword(newPass);
    await user.save({ validateBeforeSave: false });

    emailService.sendSecurityNotification(
      user.email,
      user.name,
      'Password Changed',
      'Your BreakIfy account password was updated.'
    ).catch(() => {});
  }

  async requestEmailChange(userId: string, currentPass: string, newEmail: string): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (user.email === newEmail.toLowerCase()) {
      throw new AppError('New email cannot be identical to current email.', 400);
    }

    const emailInUse = await User.findOne({ email: newEmail.toLowerCase() });
    if (emailInUse) {
      throw new AppError('This email address is already in use.', 409);
    }

    if (user.authProvider === 'local') {
      const isValid = await verifyPassword(user.passwordHash || '', currentPass);
      if (!isValid) {
        throw new AppError('Current password is required to request an email change.', 400);
      }
    }

    const { raw: rawToken, hashed: changeToken } = generateRandomToken(32);
    user.pendingEmail = newEmail.toLowerCase();
    user.emailChangeToken = changeToken;
    user.emailChangeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await emailService.sendEmailChangeVerification(newEmail, user.name, rawToken);
  }

  async confirmEmailChange(rawToken: string): Promise<{ newEmail: string }> {
    const hashedToken = hashToken(rawToken);

    const user = await User.findOne({
      emailChangeToken: hashedToken,
      emailChangeExpires: { $gt: new Date() },
    }).select('+emailChangeToken +emailChangeExpires');

    if (!user || !user.pendingEmail) {
      throw new AppError('Email change verification link is invalid or expired.', 400);
    }

    const oldEmail = user.email;
    const newEmail = user.pendingEmail;

    user.email = newEmail;
    user.pendingEmail = undefined;
    user.emailChangeToken = undefined;
    user.emailChangeExpires = undefined;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    emailService.sendSecurityNotification(
      oldEmail,
      user.name,
      'Account Email Updated',
      `Your account email was changed from ${oldEmail} to ${newEmail}.`
    ).catch(() => {});

    return { newEmail };
  }

  async removeAvatar(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    user.avatar = '';
    await user.save({ validateBeforeSave: false });
    return this.getProfile(userId);
  }

  async getSessions(userId: string, currentSessionId?: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return (user.activeSessions || []).map((session) => ({
      sessionId: session.sessionId,
      device: session.device || 'Desktop',
      browser: session.browser || 'Unknown',
      os: session.os || 'Unknown',
      location: session.location || 'Unknown',
      userAgent: session.userAgent || 'Unknown Device',
      ipAddress: session.ipAddress || 'Unknown IP',
      createdAt: session.createdAt,
      lastActive: session.lastActive,
      isCurrent: session.sessionId === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionIdToRevoke: string, currentSessionId?: string): Promise<void> {
    if (sessionIdToRevoke === currentSessionId) {
      throw new AppError('Cannot revoke current active session. Use sign out instead.', 400);
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { activeSessions: { sessionId: sessionIdToRevoke } },
    });
  }

  async deleteAccount(userId: string, password?: string): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (user.authProvider === 'local') {
      if (!password) {
        throw new AppError('Password is required to delete your account.', 400);
      }
      const isValid = await verifyPassword(user.passwordHash || '', password);
      if (!isValid) {
        throw new AppError('Incorrect password. Account deletion canceled.', 400);
      }
    }

    await User.findByIdAndDelete(userId);
    await Link.deleteMany({ ownerId: userId }).catch(() => {});
    await ActivityLog.deleteMany({ userId }).catch(() => {});
    await Notification.deleteMany({ userId }).catch(() => {});

    emailService.sendSecurityNotification(
      user.email,
      user.name,
      'Account Deleted',
      'Your BreakIfy account and associated data have been permanently removed.'
    ).catch(() => {});
  }
}

export const userService = new UserService();
