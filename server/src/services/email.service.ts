import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<void>;
  sendVerificationEmail(to: string, name: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, name: string, token: string): Promise<void>;
  sendEmailChangeVerification(to: string, name: string, token: string): Promise<void>;
  sendSecurityNotification(to: string, name: string, event: string, details?: string): Promise<void>;
  sendOtpEmail(to: string, name: string, otpCode: string, purpose?: string): Promise<void>;
}

class EmailService implements IEmailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (env.EMAIL_SERVICE === 'smtp' && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      logger.info(`SMTP Email transporter configured (${env.SMTP_HOST}:${env.SMTP_PORT})`);
    } else {
      logger.info('Email service initialized in CONSOLE mode (emails will be logged to server console)');
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });
        logger.info(`Email sent successfully to ${options.to} [Subject: ${options.subject}]`);
      } catch (err) {
        logger.error(`Failed to send email via SMTP to ${options.to}:`, err);
        // Fallback log to console so tokens are never lost
        this.logEmailToConsole(options);
      }
    } else {
      this.logEmailToConsole(options);
    }
  }

  private logEmailToConsole(options: EmailOptions): void {
    logger.info('================= [TRANSACTIONAL EMAIL DISPATCH] =================');
    logger.info(`TO: ${options.to}`);
    logger.info(`SUBJECT: ${options.subject}`);
    logger.info(`BODY (TEXT): \n${options.text}`);
    logger.info('==================================================================');
  }

  private getEmailTemplate(
    title: string,
    contentHtml: string,
    actionUrl?: string,
    actionText?: string,
    otpCode?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #09090b;
              color: #f4f4f5;
              margin: 0;
              padding: 40px 16px;
              -webkit-font-smoothing: antialiased;
            }
            .container {
              max-width: 520px;
              margin: 0 auto;
              background-color: #121214;
              border: 1px solid #27272a;
              border-radius: 12px;
              padding: 32px 28px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            }
            .header-badge {
              display: inline-block;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #a1a1aa;
              background-color: #18181b;
              border: 1px solid #27272a;
              padding: 4px 10px;
              border-radius: 9999px;
              margin-bottom: 20px;
            }
            .logo {
              font-size: 22px;
              font-weight: 800;
              color: #ffffff;
              letter-spacing: -0.5px;
              margin-bottom: 6px;
            }
            .logo-accent {
              color: #71717a;
            }
            .tagline {
              font-size: 12px;
              color: #71717a;
              margin-bottom: 24px;
            }
            h1 {
              font-size: 18px;
              font-weight: 700;
              color: #ffffff;
              margin-top: 0;
              margin-bottom: 14px;
            }
            p {
              font-size: 14px;
              line-height: 1.6;
              color: #d4d4d8;
              margin-bottom: 20px;
            }
            .btn-wrapper {
              text-align: center;
              margin: 28px 0;
            }
            .btn {
              display: inline-block;
              background-color: #ffffff;
              color: #09090b !important;
              text-decoration: none;
              font-size: 14px;
              font-weight: 700;
              padding: 13px 32px;
              border-radius: 8px;
              box-shadow: 0 4px 14px rgba(255, 255, 255, 0.15);
              transition: all 0.2s ease;
            }
            .otp-box {
              background-color: #18181b;
              border: 1px solid #3f3f46;
              border-radius: 10px;
              padding: 20px;
              text-align: center;
              margin: 24px 0;
            }
            .otp-code {
              font-size: 32px;
              font-weight: 800;
              letter-spacing: 8px;
              color: #ffffff;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            }
            .otp-hint {
              font-size: 11px;
              color: #a1a1aa;
              margin-top: 8px;
            }
            .notice-card {
              background-color: #18181b;
              border-left: 3px solid #71717a;
              padding: 12px 14px;
              border-radius: 4px;
              font-size: 12px;
              color: #a1a1aa;
              margin: 20px 0;
              line-height: 1.5;
            }
            .footer {
              font-size: 11px;
              color: #71717a;
              border-top: 1px solid #27272a;
              padding-top: 20px;
              margin-top: 32px;
              text-align: center;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header-badge">BreakIfy Account Security</div>
            <div class="logo">Break<span class="logo-accent">Ify</span></div>
            <div class="tagline">Official security notification from BreakIfy</div>
            
            <h1>${title}</h1>
            <div>${contentHtml}</div>

            ${
              actionUrl && actionText
                ? `<div class="btn-wrapper">
                     <a href="${actionUrl}" class="btn" target="_blank">${actionText}</a>
                   </div>`
                : ''
            }

            ${
              otpCode
                ? `<div class="otp-box">
                     <div class="otp-code">${otpCode}</div>
                     <div class="otp-hint">Valid for 10 minutes. Never share this code with anyone.</div>
                   </div>`
                : ''
            }

            <div class="footer">
              &copy; 2026 BreakIfy. All Rights Reserved. Don&apos;t reply to this automated email.
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;
    const title = 'Verify your BreakIfy account';
    const content = `
      <p>Hello ${name},</p>
      <p>Yeh email BreakIfy account security system ki taraf se bheji gayi hai. Please click the button below to verify your email address and activate your BreakIfy account.</p>
      <div class="notice-card">This verification link is active for 24 hours.</div>
    `;
    const text = `Hello ${name},\n\nYeh email BreakIfy account security system ki taraf se bheji gayi hai.\nPlease verify your email address by opening the following link:\n${verifyUrl}\n\nThis verification link expires in 24 hours.\n\n© 2026 BreakIfy. All Rights Reserved. Don't reply to this automated email.`;

    await this.sendEmail({
      to,
      subject: 'Verify your BreakIfy account',
      html: this.getEmailTemplate(title, content, verifyUrl, 'Verify Email Address'),
      text,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;
    const title = 'Reset your BreakIfy password';
    const content = `
      <p>Hello ${name},</p>
      <p>Yeh email BreakIfy account security system ki taraf se bheji gayi hai. We received a request to reset your password. Click the button below to securely set your new password.</p>
      <div class="notice-card">If you did not request a password reset, you can safely ignore this email. Your account remains secure. This button expires in 1 hour.</div>
    `;
    const text = `Hello ${name},\n\nYeh email BreakIfy account security system ki taraf se bheji gayi hai.\nYou requested a password reset. Reset your password here:\n${resetUrl}\n\nThis link expires in 1 hour.\n\n© 2026 BreakIfy. All Rights Reserved. Don't reply to this automated email.`;

    await this.sendEmail({
      to,
      subject: 'BreakIfy: Password Reset Request',
      html: this.getEmailTemplate(title, content, resetUrl, 'Reset Password'),
      text,
    });
  }

  async sendOtpEmail(to: string, name: string, otpCode: string, purpose = 'verification'): Promise<void> {
    const title = 'BreakIfy One-Time Password (OTP)';
    const content = `
      <p>Hello ${name},</p>
      <p>Yeh email BreakIfy ki taraf se bheji gayi hai. Use the following One-Time Password (OTP) for your ${purpose}:</p>
      <div class="notice-card">Never share your OTP or account credentials with anyone. BreakIfy staff will never ask for your code.</div>
    `;
    const text = `Hello ${name},\n\nYeh email BreakIfy ki taraf se bheji gayi hai.\nYour One-Time Password (OTP) for ${purpose} is:\n${otpCode}\n\nValid for 10 minutes.\n\n© 2026 BreakIfy. All Rights Reserved. Don't reply to this automated email.`;

    await this.sendEmail({
      to,
      subject: `BreakIfy: Your OTP Code is ${otpCode}`,
      html: this.getEmailTemplate(title, content, undefined, undefined, otpCode),
      text,
    });
  }

  async sendEmailChangeVerification(to: string, name: string, token: string): Promise<void> {
    const confirmUrl = `${env.CLIENT_URL}/confirm-email-change?token=${token}`;
    const title = 'Confirm your new email address';
    const content = `
      <p>Hello ${name},</p>
      <p>Yeh email BreakIfy account security system ki taraf se bheji gayi hai. You requested to update your email address on BreakIfy to this inbox. Click below to verify and complete the update.</p>
      <div class="notice-card">This confirmation button is active for 24 hours.</div>
    `;
    const text = `Hello ${name},\n\nYeh email BreakIfy account security system ki taraf se bheji gayi hai.\nPlease confirm your new email address by visiting:\n${confirmUrl}\n\nThis link expires in 24 hours.\n\n© 2026 BreakIfy. All Rights Reserved. Don't reply to this automated email.`;

    await this.sendEmail({
      to,
      subject: 'Confirm your new BreakIfy email address',
      html: this.getEmailTemplate(title, content, confirmUrl, 'Confirm Email Update'),
      text,
    });
  }

  async sendSecurityNotification(to: string, name: string, event: string, details?: string): Promise<void> {
    const title = `Security Alert: ${event}`;
    const content = `
      <p>Hello ${name},</p>
      <p>Yeh email BreakIfy account security system ki taraf se bheji gayi hai. The following security event was logged on your account:</p>
      <div class="notice-card"><strong>Event:</strong> ${event}${details ? `<br><strong>Details:</strong> ${details}` : ''}</div>
      <p>If you authorized this activity, no further action is necessary. If you suspect unauthorized access, please update your account password immediately.</p>
    `;
    const text = `Hello ${name},\n\nYeh email BreakIfy account security system ki taraf se bheji gayi hai.\nSecurity Alert: ${event}\n${details ? `${details}\n` : ''}\nIf you did not authorize this, please reset your password immediately.\n\n© 2026 BreakIfy. All Rights Reserved. Don't reply to this automated email.`;

    await this.sendEmail({
      to,
      subject: `[BreakIfy Security] ${event}`,
      html: this.getEmailTemplate(title, content),
      text,
    });
  }
}

export const emailService: IEmailService = new EmailService();
