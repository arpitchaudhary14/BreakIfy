export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const API_BASE = '/api/v1/notifications';

export const notificationApi = {
  async getNotifications(params: { unreadOnly?: boolean; page?: number; limit?: number } = {}): Promise<NotificationsResponse> {
    const q = new URLSearchParams();
    if (params.unreadOnly) q.append('unreadOnly', 'true');
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));

    const qs = q.toString();
    const url = qs ? `${API_BASE}?${qs}` : API_BASE;

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to load notifications: ${res.statusText}`);
    }

    const body = await res.json();
    return body.data;
  },

  async markAsRead(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to mark notification as read: ${res.statusText}`);
    }
  },

  async markAllAsRead(): Promise<{ modifiedCount: number }> {
    const res = await fetch(`${API_BASE}/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to mark all as read: ${res.statusText}`);
    }

    const body = await res.json();
    return body.data;
  },

  async deleteNotification(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Failed to delete notification: ${res.statusText}`);
    }
  },
};

