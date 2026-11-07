import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IClickEvent extends Document {
  link: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  timestamp: Date;
  ip: string; // Visitor Public IP
  sessionId: string; // Visitor tracking session identifier
  visitorHash: string; // Privacy-preserving pseudonymous daily hash
  referrer: string;
  country: string;
  city?: string;
  device: string; // 'desktop' | 'mobile' | 'tablet' | 'unknown'
  browser: string;
  os: string;
  isQr: boolean;
  source: string; // 'qr' | 'web' | custom
  isBot: boolean;
}

const ClickEventSchema = new Schema<IClickEvent>(
  {
    link: {
      type: Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ip: {
      type: String,
      default: 'Unknown',
      trim: true,
      index: true,
    },
    sessionId: {
      type: String,
      default: 'Unknown',
      trim: true,
      index: true,
    },
    visitorHash: {
      type: String,
      required: true,
      index: true,
    },
    referrer: {
      type: String,
      default: 'Direct',
      trim: true,
      index: true,
    },
    country: {
      type: String,
      default: 'Unknown',
      uppercase: true,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      trim: true,
    },
    device: {
      type: String,
      default: 'unknown',
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      index: true,
    },
    browser: {
      type: String,
      default: 'Other',
      trim: true,
      index: true,
    },
    os: {
      type: String,
      default: 'Other',
      trim: true,
      index: true,
    },
    isQr: {
      type: Boolean,
      default: false,
      index: true,
    },
    source: {
      type: String,
      default: 'web',
      trim: true,
    },
    isBot: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// High performance compound indexes for analytics aggregations
ClickEventSchema.index({ owner: 1, timestamp: -1 });
ClickEventSchema.index({ link: 1, timestamp: -1 });
ClickEventSchema.index({ owner: 1, isBot: 1, timestamp: -1 });
ClickEventSchema.index({ link: 1, isBot: 1, timestamp: -1 });

export const ClickEvent: Model<IClickEvent> = mongoose.model<IClickEvent>('ClickEvent', ClickEventSchema);

