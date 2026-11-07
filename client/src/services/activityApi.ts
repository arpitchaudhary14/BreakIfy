export interface ActivityLogItem {
  _id: string;
  action: string;
  category: 'link' | 'qr' | 'auth' | 'security' | 'settings' | 'system';
  description: string;
  metadata?: Record<string, unknown>;
  ip: string;
  userAgent: string;
  createdAt: string;
}

export interface ActivityFilterParams {
  search?: string;
  category?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ActivityLogsResponse {
  logs: ActivityLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const API_BASE = '/api/v1/activity';

function buildQuery(params: ActivityFilterParams): string {
  const q = new URLSearchParams();
  if (params.search) q.append('search', params.search);
  if (params.category && params.category !== 'all') q.append('category', params.category);
  if (params.action && params.action !== 'all') q.append('action', params.action);
  if (params.startDate) q.append('startDate', params.startDate);
  if (params.endDate) q.append('endDate', params.endDate);
  if (params.page) q.append('page', String(params.page));
  if (params.limit) q.append('limit', String(params.limit));
  if (params.sort) q.append('sort', params.sort);
  return q.toString();
}

export const activityApi = {
  async getActivityLogs(params: ActivityFilterParams = {}): Promise<ActivityLogsResponse> {
    const qs = buildQuery(params);
    const url = qs ? `${API_BASE}?${qs}` : API_BASE;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to load activity logs: ${res.statusText}`);
    }

    const body = await res.json();
    return body.data;
  },

  async deleteActivityLog(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to delete activity log: ${res.statusText}`);
    }
  },

  async bulkDeleteActivityLogs(ids: string[]): Promise<{ deletedCount: number }> {
    const res = await fetch(`${API_BASE}/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) {
      throw new Error(`Failed to bulk delete logs: ${res.statusText}`);
    }

    const body = await res.json();
    return body.data;
  },

  async clearAllHistory(): Promise<{ deletedCount: number }> {
    const res = await fetch(`${API_BASE}/clear-all`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to clear activity history: ${res.statusText}`);
    }

    const body = await res.json();
    return body.data;
  },
};

