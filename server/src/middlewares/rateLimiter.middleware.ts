import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many login attempts from this IP address. Please wait 15 minutes before trying again.',
    },
  },
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many accounts created from this IP. Please try again in an hour.',
    },
  },
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many password reset requests. Please check your inbox or wait an hour.',
    },
  },
});

export const twoFactorLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many 2FA verification attempts. Please wait 10 minutes.',
    },
  },
});

export const urlCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 links per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'URL creation rate limit exceeded. Please wait a minute before creating more links.',
    },
  },
});

export const abuseReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many abuse reports submitted from this IP. Please try again later.',
    },
  },
});

export const redirectLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 600, // 600 redirects per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'High traffic volume detected on redirect service. Please retry shortly.',
    },
  },
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many API requests from this IP. Please slow down.',
    },
  },
});
