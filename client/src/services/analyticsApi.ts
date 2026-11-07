export interface TopLinkItem {
  _id: string;
  title: string;
  shortCode: string;
  originalUrl: string;
  clicksInPeriod: number;
}

export interface AnalyticsOverview {
  totalClicks: number;
  uniqueVisitors: number;
  qrScans: number;
  qrShare: number;
  botClicks: number;
  topLink: TopLinkItem | null;
}

export interface TimeSeriesPoint {
  date: string;
  clicks: number;
  qrScans: number;
  uniqueVisitors: number;
}

export interface BreakdownItem {
  name: string;
  count: number;
  percentage: number;
}

export interface ClickEventItem {
  _id: string;
  rawTime: string;
  timestamp: string;
  ip: string;
  sessionId: string;
  linkTitle: string;
  shortCode: string;
  originalUrl: string;
  device: string;
  browser: string;
  os: string;
  country: string;
  referrer: string;
  isQr: boolean;
  isBot: boolean;
}

export interface AnalyticsBreakdowns {
  devices: BreakdownItem[];
  browsers: BreakdownItem[];
  operatingSystems: BreakdownItem[];
  countries: BreakdownItem[];
  referrers: BreakdownItem[];
  totalClicks: number;
}

export interface AnalyticsFilterParams {
  linkId?: string;
  dateRange?: '24h' | '7d' | '30d' | '90d' | 'all';
  startDate?: string;
  endDate?: string;
  includeBots?: boolean;
  country?: string;
  device?: string;
}

const API_BASE = '/api/v1/analytics';

function buildQuery(params: AnalyticsFilterParams): string {
  const q = new URLSearchParams();
  if (params.linkId && params.linkId !== 'all') q.set('linkId', params.linkId);
  if (params.dateRange) q.set('dateRange', params.dateRange);
  if (params.startDate) q.set('startDate', params.startDate);
  if (params.endDate) q.set('endDate', params.endDate);
  if (params.includeBots) q.set('includeBots', 'true');
  if (params.country && params.country !== 'all') q.set('country', params.country);
  if (params.device && params.device !== 'all') q.set('device', params.device);
  const str = q.toString();
  return str ? `?${str}` : '';
}

async function request<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const errorMsg = json.error?.message || json.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return json.data as T;
}

export const analyticsApi = {
  getOverview: (params: AnalyticsFilterParams = {}) => {
    return request<AnalyticsOverview>(`/overview${buildQuery(params)}`);
  },

  getTimeSeries: (params: AnalyticsFilterParams = {}) => {
    return request<{ series: TimeSeriesPoint[] }>(`/timeseries${buildQuery(params)}`);
  },

  getBreakdowns: (params: AnalyticsFilterParams = {}) => {
    return request<AnalyticsBreakdowns>(`/breakdowns${buildQuery(params)}`);
  },

  getRecentEvents: (params: AnalyticsFilterParams = {}, limit = 50) => {
    const qs = buildQuery(params);
    const connector = qs ? '&' : '?';
    return request<{ events: ClickEventItem[] }>(`/events${qs}${connector}limit=${limit}`);
  },

  downloadCsv: async (params: AnalyticsFilterParams = {}): Promise<void> => {
    const qs = buildQuery(params);
    const res = await fetch(`${API_BASE}/export${qs}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Failed to generate CSV export.');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `breakify-analytics-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

