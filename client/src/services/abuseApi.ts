const API_BASE = '/api/v1';

export type AbuseReason =
  | 'phishing'
  | 'malware'
  | 'spam'
  | 'hate_speech'
  | 'harassment'
  | 'illegal_content'
  | 'other';

export interface CreateAbuseReportPayload {
  shortCode: string;
  originalUrl?: string;
  reason: AbuseReason;
  details: string;
  reporterEmail?: string;
}

export const abuseApi = {
  submitReport: async (payload: CreateAbuseReportPayload) => {
    const res = await fetch(`${API_BASE}/abuse/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || json.message || 'Failed to submit abuse report');
    }

    return json.data as { reportId: string; status: string; createdAt: string };
  },
};

