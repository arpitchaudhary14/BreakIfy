import mongoose, { Document, Schema, Model } from 'mongoose';

export type AbuseReason =
  | 'phishing'
  | 'malware'
  | 'spam'
  | 'hate_speech'
  | 'harassment'
  | 'illegal_content'
  | 'other';

export type AbuseReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';
export type AbuseActionTaken = 'none' | 'link_suspended' | 'link_deleted';

export interface IAbuseReport extends Document {
  shortCode: string;
  originalUrl: string;
  linkId?: mongoose.Types.ObjectId;
  reason: AbuseReason;
  details?: string;
  reporterEmail?: string;
  reporterIp: string;
  status: AbuseReportStatus;
  adminNotes?: string;
  actionTaken: AbuseActionTaken;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AbuseReportSchema = new Schema<IAbuseReport>(
  {
    shortCode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    linkId: {
      type: Schema.Types.ObjectId,
      ref: 'Link',
      index: true,
    },
    reason: {
      type: String,
      enum: ['phishing', 'malware', 'spam', 'hate_speech', 'harassment', 'illegal_content', 'other'],
      required: true,
      index: true,
    },
    details: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    reporterEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    reporterIp: {
      type: String,
      default: 'Unknown',
    },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    actionTaken: {
      type: String,
      enum: ['none', 'link_suspended', 'link_deleted'],
      default: 'none',
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

AbuseReportSchema.index({ status: 1, createdAt: -1 });
AbuseReportSchema.index({ shortCode: 1, status: 1 });

export const AbuseReport: Model<IAbuseReport> = mongoose.model<IAbuseReport>(
  'AbuseReport',
  AbuseReportSchema
);

