import { z } from 'zod';
import { validateSafeUrl, isValidSlug } from '../utils/url.util.js';

const safeDestinationUrl = z
  .string()
  .trim()
  .min(5, 'Destination URL is required')
  .max(2048, 'URL exceeds maximum length of 2048 characters')
  .refine((val) => validateSafeUrl(val).isValid, {
    message: 'Invalid destination URL or restricted internal hostname.',
  });

export const geoRuleSchema = z.object({
  countryCode: z.string().trim().length(2, 'Country code must be 2-letter ISO (e.g. US, DE)').toUpperCase(),
  destinationUrl: safeDestinationUrl,
});

export const deviceRulesSchema = z.object({
  desktop: safeDestinationUrl.optional().or(z.literal('')),
  mobile: safeDestinationUrl.optional().or(z.literal('')),
  tablet: safeDestinationUrl.optional().or(z.literal('')),
});

export const abVariantSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  name: z.string().trim().min(1, 'Variant name required').max(50),
  destinationUrl: safeDestinationUrl,
  weight: z.number().int().min(1).max(100).default(50),
});

export const abTestingSchema = z.object({
  enabled: z.boolean().default(false),
  variants: z.array(abVariantSchema).default([]),
});

export const createLinkSchema = z.object({
  originalUrl: safeDestinationUrl,
  customSlug: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || isValidSlug(val), {
      message: 'Custom slug must be 3-30 characters (alphanumeric, hyphen, underscore) and not a reserved keyword.',
    }),
  title: z.string().trim().max(120, 'Title cannot exceed 120 characters').optional(),

  // Advanced Controls
  password: z.string().min(4, 'Password must be at least 4 characters').max(50).optional(),
  startsAt: z
    .string()
    .datetime({ offset: true })
    .or(z.string().datetime())
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : undefined)),
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .or(z.string().datetime())
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : undefined)),
  maxClicks: z.number().int().min(1, 'Click limit must be at least 1').optional().nullable(),

  geoRules: z.array(geoRuleSchema).max(20).optional(),
  deviceRules: deviceRulesSchema.optional(),
  abTesting: abTestingSchema.optional(),

  tags: z.array(z.string().trim().max(30)).max(10, 'Maximum 10 tags allowed').optional(),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional(),
}).refine(
  (data) => {
    if (data.startsAt && data.expiresAt) {
      return data.startsAt.getTime() < data.expiresAt.getTime();
    }
    return true;
  },
  {
    message: 'Scheduled activation start time must be before expiration date and time.',
    path: ['expiresAt'],
  }
);

export const updateLinkSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  originalUrl: safeDestinationUrl.optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),

  // Advanced Controls
  password: z.string().min(4).max(50).optional(),
  removePassword: z.boolean().optional(),
  startsAt: z
    .string()
    .datetime({ offset: true })
    .or(z.string().datetime())
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .or(z.string().datetime())
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  maxClicks: z.number().int().min(1).optional().nullable(),

  geoRules: z.array(geoRuleSchema).max(20).optional(),
  deviceRules: deviceRulesSchema.optional(),
  abTesting: abTestingSchema.optional(),

  tags: z.array(z.string().trim().max(30)).max(10).optional(),
  notes: z.string().trim().max(500).optional(),
}).refine(
  (data) => {
    if (data.startsAt && data.expiresAt) {
      return data.startsAt.getTime() < data.expiresAt.getTime();
    }
    return true;
  },
  {
    message: 'Scheduled activation start time must be before expiration date and time.',
    path: ['expiresAt'],
  }
);

export const verifyLinkPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const bulkActionSchema = z.object({
  linkIds: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid link ID format'))
    .min(1, 'Please select at least one link')
    .max(100, 'Cannot operate on more than 100 links at once'),
  action: z.enum(['delete', 'activate', 'deactivate', 'archive', 'add-tag']),
  tag: z.string().trim().max(30).optional(),
});
