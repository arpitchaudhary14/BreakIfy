import crypto from 'crypto';
import QRCode from 'qrcode';

// RFC 4648 Base32 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer into a Base32 string (RFC 4648 without padding).
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer.
 */
export function base32Decode(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically secure 20-byte Base32 secret for TOTP.
 */
export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  return base32Encode(bytes);
}

/**
 * Formats an otpauth:// URI for mobile authenticator apps.
 */
export function generateOtpAuthUri(options: {
  secret: string;
  accountEmail: string;
  issuer?: string;
}): string {
  const issuer = options.issuer || 'BreakIfy';
  const label = encodeURIComponent(`${issuer}:${options.accountEmail}`);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${options.secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates a QR Code Data URL for the otpauth URI.
 */
export async function generateQrCodeDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, {
    margin: 2,
    width: 256,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Generates a 6-digit TOTP code for a given secret and counter step.
 */
export function computeTotp(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter), 0);

  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const digest = hmac.digest();

  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP token against a secret.
 * Supports ±1 window step tolerance for clock drift (covers 90 seconds).
 */
export function verifyTotpToken(
  secretBase32: string,
  token: string,
  window = 1
): boolean {
  if (!token || typeof token !== 'string') return false;
  const cleaned = token.trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleaned)) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);

  for (let i = -window; i <= window; i++) {
    const computed = computeTotp(secretBase32, currentStep + i);
    if (crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(cleaned))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates N recovery codes formatted as `XXXX-XXXX`.
 */
export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude ambiguous 0,1,O,I

  for (let i = 0; i < count; i++) {
    let code = '';
    const bytes = crypto.randomBytes(8);
    for (let j = 0; j < 8; j++) {
      code += chars[bytes[j] % chars.length];
      if (j === 3) code += '-';
    }
    codes.push(code);
  }

  return codes;
}

/**
 * Hashes a recovery code for secure database storage.
 */
export function hashRecoveryCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/[\s-]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Verifies a recovery code against a stored hash using timing-safe comparison.
 */
export function verifyRecoveryCode(inputCode: string, storedHash: string): boolean {
  const inputHash = hashRecoveryCode(inputCode);
  return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(storedHash, 'hex'));
}

