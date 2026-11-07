import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, ApiUser, UserSession } from '../services/authApi';

interface AuthContextType {
  user: ApiUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ requires2FA?: boolean; tempToken?: string }>;
  verify2FALogin: (tempToken: string, token?: string, recoveryCode?: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<string>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<void>;
  removeAvatar: () => Promise<void>;
  changePassword: (curr: string, newPass: string) => Promise<void>;
  requestEmailChange: (curr: string, newEmail: string) => Promise<string>;
  confirmEmailChange: (token: string) => Promise<string>;
  getSessions: () => Promise<UserSession[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeOtherSessions: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial user session probe
  const refreshUser = async () => {
    try {
      const data = await authApi.getMe();
      if (data && data.user) {
        setUser(data.user);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string): Promise<{ requires2FA?: boolean; tempToken?: string }> => {
    const res = await authApi.login({ email, password: pass });
    if (res.requires2FA && res.tempToken) {
      return { requires2FA: true, tempToken: res.tempToken };
    }
    if (res.user) {
      setUser(res.user);
    }
    return { requires2FA: false };
  };

  const verify2FALogin = async (tempToken: string, token?: string, recoveryCode?: string) => {
    const res = await authApi.verify2FALogin({ tempToken, token, recoveryCode });
    if (res.user) {
      setUser(res.user);
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<string> => {
    const res = await authApi.register({ name, email, password: pass });
    setUser(res.user);
    return res.message;
  };

  const googleLogin = async (idToken: string) => {
    const res = await authApi.googleLogin(idToken);
    if (res.user) {
      setUser(res.user);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (data: { name?: string; avatar?: string }) => {
    const res = await authApi.updateProfile(data);
    setUser(res.user);
  };

  const removeAvatar = async () => {
    const res = await authApi.removeAvatar();
    setUser(res.user);
  };

  const changePassword = async (curr: string, newPass: string) => {
    await authApi.changePassword({ currentPassword: curr, newPassword: newPass });
  };

  const requestEmailChange = async (curr: string, newEmail: string): Promise<string> => {
    const res = await authApi.requestEmailChange({ currentPassword: curr, newEmail });
    return res.message;
  };

  const confirmEmailChange = async (token: string): Promise<string> => {
    const res = await authApi.confirmEmailChange(token);
    await refreshUser();
    return res.message;
  };

  const getSessions = async (): Promise<UserSession[]> => {
    return await authApi.listSessions();
  };

  const revokeSession = async (sessionId: string) => {
    await authApi.revokeSession(sessionId);
  };

  const revokeOtherSessions = async () => {
    await authApi.revokeOtherSessions();
  };

  const deleteAccount = async (password?: string) => {
    await authApi.deleteAccount(password);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        verify2FALogin,
        register,
        googleLogin,
        logout,
        updateProfile,
        removeAvatar,
        changePassword,
        requestEmailChange,
        confirmEmailChange,
        getSessions,
        revokeSession,
        revokeOtherSessions,
        deleteAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
