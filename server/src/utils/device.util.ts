import { UAParser } from 'ua-parser-js';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function detectDeviceType(userAgent?: string): DeviceType {
  if (!userAgent) {
    return 'desktop';
  }

  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  const type = device.type;

  if (type === 'mobile') {
    return 'mobile';
  }
  if (type === 'tablet') {
    return 'tablet';
  }

  // Fallback regex detection for mobile/tablet if not parsed by ua-parser
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}

