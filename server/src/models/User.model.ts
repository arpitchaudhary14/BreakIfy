import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IUserSession {
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  createdAt: Date;
  lastActive: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  authProvider: 'local' | 'google';
  googleId?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  pendingEmail?: string;
  emailChangeToken?: string;
  emailChangeExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Two-Factor Authentication
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorTempSecret?: string;
  recoveryCodes?: string[];

  // Security telemetry
  lastLoginAt?: Date;
  lastLoginIp?: string;

  accountStatus: 'active' | 'suspended' | 'deactivated';
  activeSessions: IUserSession[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>(
  {
    sessionId: { type: String, required: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    device: { type: String, default: 'Desktop' },
    browser: { type: String, default: 'Unknown' },
    os: { type: String, default: 'Unknown' },
    location: { type: String, default: 'Unknown' },
    createdAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false, // Never select passwordHash by default
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
      required: true,
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    emailChangeToken: {
      type: String,
      select: false,
    },
    emailChangeExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },

    // Two-Factor Authentication (TOTP)
    twoFactorEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    twoFactorTempSecret: {
      type: String,
      select: false,
    },
    recoveryCodes: {
      type: [String],
      select: false,
      default: [],
    },

    // Security telemetry
    lastLoginAt: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },

    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'deactivated'],
      default: 'active',
      index: true,
    },
    activeSessions: {
      type: [UserSessionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

