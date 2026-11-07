export type LinkStatus = 'active' | 'inactive' | 'archived';

export interface IGeoRule {
  countryCode: string;
  destinationUrl: string;
}

export interface IDeviceRules {
  desktop?: string;
  mobile?: string;
  tablet?: string;
}

export interface IAbVariant {
  id: string;
  name: string;
  destinationUrl: string;
  weight: number;
  clicks: number;
}

export interface IAbTesting {
  enabled: boolean;
  variants: IAbVariant[];
}

export interface ILinkHealth {
  isReachable: boolean;
  statusCode?: number;
  responseTimeMs?: number;
  error?: string;
  lastCheckedAt: string;
}

export interface LinkItem {
  _id: string;
  originalUrl: string;
  shortCode: string;
  title: string;
  status: LinkStatus;

  // Advanced Controls
  isPasswordProtected?: boolean;
  startsAt?: string;
  expiresAt?: string;
  maxClicks?: number;
  geoRules?: IGeoRule[];
  deviceRules?: IDeviceRules;
  abTesting?: IAbTesting;

  // Recycle Bin & Health
  isDeleted?: boolean;
  deletedAt?: string;
  healthStatus?: ILinkHealth;

  clicks: number;
  qrScans?: number;
  tags: string[];
  notes?: string;
  lastClickedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecycleBinItem extends LinkItem {
  deletedAt: string;
  retentionDaysRemaining: number;
}

export interface RecycleBinResponse {
  links: RecycleBinItem[];
  retentionDaysConfigured: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CsvImportResult {
  totalRows: number;
  importedCount: number;
  failedCount: number;
  errors: Array<{ row: number; error: string; rawData: Record<string, string> }>;
}

export interface CreateLinkPayload {
  originalUrl: string;
  customSlug?: string;
  title?: string;
  password?: string;
  startsAt?: string | null;
  expiresAt?: string | null;
  maxClicks?: number | null;
  geoRules?: IGeoRule[];
  deviceRules?: IDeviceRules;
  abTesting?: IAbTesting;
  tags?: string[];
  notes?: string;
}

export interface UpdateLinkPayload extends Partial<CreateLinkPayload> {
  status?: LinkStatus;
  removePassword?: boolean;
}

export interface ListLinksParams {
  search?: string;
  status?: string;
  tag?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ListLinksResponse {
  links: LinkItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const API_BASE = '/api/v1/links';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
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

export const linkApi = {
  createLink: (payload: CreateLinkPayload) =>
    request<{ link: LinkItem }>('', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listLinks: (params: ListLinksParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.status) searchParams.set('status', params.status);
    if (params.tag) searchParams.set('tag', params.tag);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    const qs = searchParams.toString();
    return request<ListLinksResponse>(qs ? `?${qs}` : '', { method: 'GET' });
  },

  getLink: (id: string) => request<{ link: LinkItem }>(`/${id}`, { method: 'GET' }),

  updateLink: (id: string, updates: UpdateLinkPayload) =>
    request<{ link: LinkItem }>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteLink: (id: string) =>
    request<{ message: string; link?: LinkItem }>(`/${id}`, {
      method: 'DELETE',
    }),

  bulkActions: (payload: {
    linkIds: string[];
    action: 'delete' | 'activate' | 'deactivate' | 'archive' | 'add-tag';
    tag?: string;
  }) =>
    request<{ message: string; affectedCount: number }>('/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Recycle Bin
  getRecycleBin: (params: { search?: string; sort?: string; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    const qs = searchParams.toString();
    return request<RecycleBinResponse>(`/recycle-bin${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  restoreLink: (id: string) =>
    request<{ message: string; link: LinkItem }>(`/${id}/restore`, { method: 'POST' }),

  permanentDeleteLink: (id: string) =>
    request<{ message: string }>(`/${id}/permanent`, { method: 'DELETE' }),

  emptyRecycleBin: () =>
    request<{ message: string; deletedCount: number }>('/recycle-bin/empty', { method: 'DELETE' }),

  bulkRestore: (linkIds: string[]) =>
    request<{ message: string; affectedCount: number }>('/recycle-bin/bulk-restore', {
      method: 'POST',
      body: JSON.stringify({ linkIds }),
    }),

  bulkPermanentDelete: (linkIds: string[]) =>
    request<{ message: string; deletedCount: number }>('/recycle-bin/bulk-permanent-delete', {
      method: 'POST',
      body: JSON.stringify({ linkIds }),
    }),

  // Link Health
  checkHealth: (id: string) =>
    request<{ health: ILinkHealth }>(`/${id}/health-check`, { method: 'POST' }),

  // CSV Import & Export
  exportCsv: async () => {
    const res = await fetch(`${API_BASE}/export`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to export links CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breakify-links-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  importCsv: (csvContent: string) =>
    request<CsvImportResult>('/import', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    }),
};
