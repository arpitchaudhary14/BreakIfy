export const RECYCLE_BIN_RETENTION_DAYS = 30;

export const ACTIVITY_CATEGORIES = [
  'link',
  'qr',
  'auth',
  'security',
  'settings',
  'system',
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const NOTIFICATION_TYPES = ['info', 'success', 'warning', 'error'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

