import mongoose, { Document, Schema, Model } from 'mongoose';

export type LinkStatus = 'active' | 'inactive' | 'archived';

export interface IGeoRule {
  countryCode: string;
  destinationUrl: string;
}

export interface IDeviceRules {
  desktop?: string;
  mobile?: string;
  tablet?: string;
}

export interface IAbVariant {
  id: string;
  name: string;
  destinationUrl: string;
  weight: number; // percentage 1-100
  clicks: number;
}

export interface IAbTesting {
  enabled: boolean;
  variants: IAbVariant[];
}

export interface ILinkHealth {
  isReachable: boolean;
  statusCode?: number;
  responseTimeMs?: number;
  error?: string;
  lastCheckedAt: Date;
}

export interface ILink extends Document {
  originalUrl: string;
  shortCode: string;
  title: string;
  owner?: mongoose.Types.ObjectId;
  status: LinkStatus;

  // Advanced Controls
  isPasswordProtected: boolean;
  passwordHash?: string;
  startsAt?: Date;
  expiresAt?: Date;
  maxClicks?: number;

  geoRules: IGeoRule[];
  deviceRules: IDeviceRules;
  abTesting: IAbTesting;

  clicks: number;
  qrScans: number;
  tags: string[];
  notes?: string;
  lastClickedAt?: Date;

  // Recycle Bin
  isDeleted: boolean;
  deletedAt?: Date;

  // Health Monitoring
  healthStatus?: ILinkHealth;

  createdAt: Date;
  updatedAt: Date;
}

const GeoRuleSchema = new Schema<IGeoRule>(
  {
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      length: 2,
    },
    destinationUrl: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const DeviceRulesSchema = new Schema<IDeviceRules>(
  {
    desktop: { type: String, trim: true },
    mobile: { type: String, trim: true },
    tablet: { type: String, trim: true },
  },
  { _id: false }
);

const AbVariantSchema = new Schema<IAbVariant>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    destinationUrl: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 1, max: 100, default: 50 },
    clicks: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const AbTestingSchema = new Schema<IAbTesting>(
  {
    enabled: { type: Boolean, default: false },
    variants: { type: [AbVariantSchema], default: [] },
  },
  { _id: false }
);

const LinkSchema = new Schema<ILink>(
  {
    originalUrl: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
      index: true,
    },

    // Advanced Link Controls
    isPasswordProtected: {
      type: Boolean,
      default: false,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    startsAt: {
      type: Date,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    maxClicks: {
      type: Number,
      min: 1,
      index: true,
    },

    geoRules: {
      type: [GeoRuleSchema],
      default: [],
    },
    deviceRules: {
      type: DeviceRulesSchema,
      default: {},
    },
    abTesting: {
      type: AbTestingSchema,
      default: { enabled: false, variants: [] },
    },

    clicks: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    qrScans: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    lastClickedAt: {
      type: Date,
    },

    // Recycle Bin
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      index: true,
    },

    // Health Monitoring
    healthStatus: {
      isReachable: { type: Boolean },
      statusCode: { type: Number },
      responseTimeMs: { type: Number },
      error: { type: String },
      lastCheckedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-speed dashboard filtering and owner queries
LinkSchema.index({ owner: 1, createdAt: -1 });
LinkSchema.index({ owner: 1, isDeleted: 1, createdAt: -1 });
LinkSchema.index({ owner: 1, isDeleted: 1, deletedAt: -1 });
LinkSchema.index({ owner: 1, status: 1 });
LinkSchema.index({ shortCode: 1, status: 1 });
LinkSchema.index({ shortCode: 1, isDeleted: 1 });

export const Link: Model<ILink> = mongoose.model<ILink>('Link', LinkSchema);
