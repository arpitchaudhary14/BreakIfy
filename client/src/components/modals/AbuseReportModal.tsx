import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { abuseApi, AbuseReason } from '../../services/abuseApi';

export interface AbuseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultShortCode?: string;
  defaultOriginalUrl?: string;
}

export function AbuseReportModal({
  isOpen,
  onClose,
  defaultShortCode = '',
  defaultOriginalUrl = '',
}: AbuseReportModalProps) {
  const [shortCode, setShortCode] = useState(defaultShortCode);
  const [originalUrl, setOriginalUrl] = useState(defaultOriginalUrl);
  const [reason, setReason] = useState<AbuseReason>('phishing');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortCode.trim()) {
      setError('Please provide the short code or URL you wish to report.');
      return;
    }
    if (details.trim().length < 5) {
      setError('Please provide a brief description (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await abuseApi.submitReport({
        shortCode: shortCode.trim(),
        originalUrl: originalUrl.trim() || undefined,
        reason,
        details: details.trim(),
        reporterEmail: reporterEmail.trim() || undefined,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit abuse report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setError(null);
    setDetails('');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Report Abuse or Malicious Link"
      description="Help us keep BreakIfy safe. All reports are queued for administrative moderation."
      maxWidth="md"
    >
      {isSuccess ? (
        <div className="py-6 space-y-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Report Submitted Successfully
            </h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Thank you for keeping the BreakIfy ecosystem safe. Our automated safety scanners and moderation team have queued this report for review.
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start space-x-2.5 text-xs text-zinc-600 dark:text-zinc-400">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              If this URL delivers malware, credential phishing, or illegal content, our team will review the audit logs and immediately suspend destination routing.
            </span>
          </div>

          <Input
            label="Short Code or Link"
            required
            placeholder="e.g. promo2026 or full short URL"
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value)}
          />

          <Input
            label="Known Destination URL (Optional)"
            placeholder="https://malicious-destination.example.com"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
          />

          <Select
            label="Reason for Report"
            value={reason}
            onChange={(e) => setReason(e.target.value as AbuseReason)}
            options={[
              { value: 'phishing', label: 'Credential Phishing / Impersonation' },
              { value: 'malware', label: 'Malware / Ransomware / Spyware' },
              { value: 'spam', label: 'Spam / Deceptive Advertising' },
              { value: 'hate_speech', label: 'Hate Speech / Harassment' },
              { value: 'illegal_content', label: 'Illegal or Prohibited Material' },
              { value: 'other', label: 'Other Security Violation' },
            ]}
          />

          <div className="space-y-1.5">
            <label htmlFor="abuse-report-details" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Details & Evidence <span className="text-red-500">*</span>
            </label>
            <textarea
              id="abuse-report-details"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 min-h-[80px]"
              placeholder="Describe why this link is abusive or harmful..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
            />
          </div>

          <Input
            label="Your Email (Optional, for status updates)"
            type="email"
            placeholder="security@yourcompany.com"
            value={reporterEmail}
            onChange={(e) => setReporterEmail(e.target.value)}
          />

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Submit Report
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

