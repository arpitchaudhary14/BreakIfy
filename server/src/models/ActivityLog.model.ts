import mongoose, { Document, Schema, Model } from 'mongoose';
import { ActivityCategory } from '../config/constants.js';

export interface IActivityLog extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  category: ActivityCategory;
  description: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['link', 'qr', 'auth', 'security', 'settings', 'system'],
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: 'Unknown',
    },
    userAgent: {
      type: String,
      default: 'Unknown',
    },
  },
  {
    timestamps: true,
  }
);

ActivityLogSchema.index({ user: 1, createdAt: -1 });
ActivityLogSchema.index({ user: 1, category: 1, createdAt: -1 });

export const ActivityLog: Model<IActivityLog> = mongoose.model<IActivityLog>(
  'ActivityLog',
  ActivityLogSchema
);

