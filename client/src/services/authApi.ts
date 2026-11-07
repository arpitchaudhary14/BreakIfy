export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isEmailVerified: boolean;
  authProvider: string;
  twoFactorEnabled?: boolean;
  role?: string;
  pendingEmail?: string;
  createdAt: string;
}

export interface UserSession {
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  createdAt: string;
  lastActive: string;
  isCurrent: boolean;
}

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Includes HTTP-only cookies
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
    const errorMsg = json.error?.message || json.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return json.data as T;
}

export const authApi = {
  // Auth endpoints
  register: (payload: { name: string; email: string; password: string }) =>
    request<{ user: ApiUser; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ user?: ApiUser; requires2FA?: boolean; tempToken?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verify2FALogin: (payload: { tempToken: string; token?: string; recoveryCode?: string }) =>
    request<{ user: ApiUser }>('/auth/2fa/verify-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  setup2FA: () =>
    request<{ secret: string; otpauthUrl: string; qrCode: string }>('/auth/2fa/setup', {
      method: 'POST',
    }),

  enable2FA: (token: string) =>
    request<{ recoveryCodes: string[] }>('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  disable2FA: (payload: { password?: string; token?: string }) =>
    request<{ message: string }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  regenerateRecoveryCodes: (token: string) =>
    request<{ recoveryCodes: string[] }>('/auth/2fa/recovery-codes', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  listSessions: () =>
    request<UserSession[]>('/auth/sessions', {
      method: 'GET',
    }),

  revokeSession: (sessionId: string) =>
    request<{ message: string }>(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    }),

  revokeOtherSessions: () =>
    request<{ message: string }>('/auth/sessions', {
      method: 'DELETE',
    }),

  googleLogin: (idToken: string) =>
    request<{ user: ApiUser }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<{ user: ApiUser }>('/auth/me', {
      method: 'GET',
    }),

  verifyEmail: (token: string) =>
    request<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  resendVerification: (email: string) =>
    request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { token: string; password: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // User endpoints
  getProfile: () =>
    request<{ user: ApiUser }>('/users/profile', {
      method: 'GET',
    }),

  updateProfile: (data: { name?: string; avatar?: string }) =>
    request<{ user: ApiUser }>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  removeAvatar: () =>
    request<{ user: ApiUser }>('/users/avatar', {
      method: 'DELETE',
    }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>('/users/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  requestEmailChange: (payload: { currentPassword: string; newEmail: string }) =>
    request<{ message: string }>('/users/change-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  confirmEmailChange: (token: string) =>
    request<{ message: string; email: string }>('/users/confirm-email-change', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  getSessions: () =>
    request<{ sessions: UserSession[] }>('/users/sessions', {
      method: 'GET',
    }),

  deleteAccount: (password?: string) =>
    request<{ message: string }>('/users/account', {
      method: 'DELETE',
      body: JSON.stringify({ password, confirmText: 'DELETE' }),
    }),
};
