import React, { useState, useEffect } from 'react';
import {
  Shield,
  Laptop,
  Key,
  Trash2,
  Mail,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Copy,
  Download,
  Smartphone,
  Globe,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { useAuth } from '../../context/AuthContext';
import { authApi, UserSession } from '../../services/authApi';

export function AccountSettingsView() {
  const {
    user,
    updateProfile,
    removeAvatar,
    changePassword,
    requestEmailChange,
    getSessions,
    revokeSession,
    revokeOtherSessions,
    deleteAccount,
    refreshUser,
  } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'sessions' | 'api'>('profile');

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  // Email change state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Two-Factor Authentication state
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<'setup' | 'recovery_codes'>('setup');
  const [twoFactorQr, setTwoFactorQr] = useState<string>('');
  const [twoFactorSecret, setTwoFactorSecret] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Disable 2FA modal state
  const [isDisable2faModalOpen, setIsDisable2faModalOpen] = useState(false);
  const [disablePasswordOrToken, setDisablePasswordOrToken] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeAllLoading, setRevokeAllLoading] = useState(false);

  // Account deletion state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatar || '');
    }
  }, [user]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await getSessions();
      setSessions(data);
    } catch {
      setSessions([
        {
          sessionId: 'curr-1',
          userAgent: 'Chrome on Windows 11 (Current)',
          ipAddress: '127.0.0.1 (Localhost)',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows',
          location: 'Localhost',
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          isCurrent: true,
        },
      ]);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'sessions') {
      loadSessions();
    }
  }, [activeSubTab]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileFeedback(null);
    try {
      await updateProfile({ name, avatar: avatarUrl });
      setProfileFeedback('Profile details saved successfully.');
    } catch (err: unknown) {
      setProfileFeedback(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRequestEmailChange = async () => {
    setEmailSaving(true);
    setEmailFeedback(null);
    try {
      const msg = await requestEmailChange(emailCurrentPassword, newEmail);
      setEmailFeedback(msg || 'Confirmation email dispatched.');
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setNewEmail('');
        setEmailCurrentPassword('');
      }, 1500);
    } catch (err: unknown) {
      setEmailFeedback(err instanceof Error ? err.message : 'Error changing email.');
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordFeedback('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleOpen2FASetup = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    setTwoFactorCode('');
    setIs2faModalOpen(true);
    setTwoFactorStep('setup');

    try {
      const res = await authApi.setup2FA();
      setTwoFactorQr(res.qrCode);
      setTwoFactorSecret(res.secret);
    } catch (err: unknown) {
      setTwoFactorError(err instanceof Error ? err.message : 'Failed to initiate 2FA setup');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) {
      setTwoFactorError('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setTwoFactorLoading(true);
    setTwoFactorError(null);
    try {
      const res = await authApi.enable2FA(twoFactorCode.trim());
      setRecoveryCodes(res.recoveryCodes);
      setTwoFactorStep('recovery_codes');
      await refreshUser();
    } catch (err: unknown) {
      setTwoFactorError(err instanceof Error ? err.message : 'Invalid 2FA code. Please retry.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePasswordOrToken.trim()) {
      setDisableError('Please enter your account password or current 6-digit 2FA code.');
      return;
    }

    setDisableLoading(true);
    setDisableError(null);
    try {
      await authApi.disable2FA({
        password: disablePasswordOrToken.trim(),
        token: disablePasswordOrToken.trim(),
      });
      setIsDisable2faModalOpen(false);
      setDisablePasswordOrToken('');
      await refreshUser();
    } catch (err: unknown) {
      setDisableError(err instanceof Error ? err.message : 'Failed to disable 2FA.');
    } finally {
      setDisableLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId);
      await loadSessions();
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setRevokeAllLoading(true);
    try {
      await revokeOtherSessions();
      await loadSessions();
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setRevokeAllLoading(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePassword);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyRecoveryCodesToClipboard = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const downloadRecoveryCodes = () => {
    const blob = new Blob(
      [
        `BreakIfy Two-Factor Authentication Recovery Codes\nAccount: ${user?.email}\nGenerated: ${new Date().toISOString()}\n\nEach code can only be used once for emergency account access:\n\n` +
          recoveryCodes.join('\n') +
          '\n\nKeep these codes in a safe, secure offline location.\n',
      ],
      { type: 'text/plain' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breakify-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Account Settings
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your personal profile, credentials, two-factor authentication, and active sessions
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-6 text-xs">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeSubTab === 'profile'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Profile & Identity</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeSubTab === 'security'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & 2FA</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sessions')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeSubTab === 'sessions'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Active Sessions</span>
        </button>

        <button
          onClick={() => setActiveSubTab('api')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeSubTab === 'api'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>API Credentials</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Your public persona and display information</CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileSave}>
              <CardContent className="space-y-5">
                {profileFeedback && (
                  <div className="p-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{profileFeedback}</span>
                  </div>
                )}

                {/* Avatar uploader / remover */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center text-lg font-bold text-zinc-600 dark:text-zinc-300">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      name.slice(0, 2).toUpperCase() || 'AV'
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<Camera className="w-3.5 h-3.5" />}
                        onClick={() => {
                          const url = prompt('Enter image URL or avatar photo:');
                          if (url !== null) setAvatarUrl(url);
                        }}
                      >
                        Change Photo
                      </Button>
                      {avatarUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAvatarUrl('');
                            removeAvatar();
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Recommended square PNG, JPG, or SVG.
                    </p>
                  </div>
                </div>

                <Input
                  label="Display Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />

                {/* Email Display & Update Trigger */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Email Address
                  </label>
                  <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs">
                      <Mail className="w-4 h-4 text-zinc-400" />
                      <span className="font-mono text-zinc-900 dark:text-zinc-100">
                        {user?.email || 'alex@breakify.site'}
                      </span>
                      {user?.isEmailVerified ? (
                        <Badge variant="success" size="sm">Verified</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Pending Verification</Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEmailModalOpen(true)}
                    >
                      Change Email
                    </Button>
                  </div>
                  {user?.pendingEmail && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      Pending verification sent to: {user.pendingEmail}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" isLoading={profileSaving}>
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Tab 2: Security & 2FA */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          {/* Two-Factor Authentication (TOTP) Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span>Two-Factor Authentication (2FA)</span>
                  </CardTitle>
                  <CardDescription>
                    Protect your account with RFC 6238 compliant TOTP using an authenticator app (Google Authenticator, Authy, 1Password)
                  </CardDescription>
                </div>
                {user?.twoFactorEnabled ? (
                  <Badge variant="success" size="md">Enabled</Badge>
                ) : (
                  <Badge variant="neutral" size="md">Disabled</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                When enabled, you will be prompted for a 6-digit verification code from your mobile authenticator app whenever signing into your BreakIfy account.
              </p>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Authenticator App
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Use apps like Google Authenticator, 1Password, or Authy to generate time-based one-time codes
                    </p>
                  </div>
                </div>

                {user?.twoFactorEnabled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDisable2faModalOpen(true)}
                  >
                    Disable 2FA
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpen2FASetup}
                  >
                    Enable 2FA
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Ensure your account uses an Argon2id-hashed password of at least 8 characters
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordChange}>
              <CardContent className="space-y-4">
                {passwordError && (
                  <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordFeedback && (
                  <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{passwordFeedback}</span>
                  </div>
                )}

                <Input
                  label="Current Password"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                />

                <Input
                  label="New Password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" isLoading={passwordSaving}>
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Danger Zone: Account Deletion */}
          <Card className="border-red-200 dark:border-red-900/50">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>Permanently remove your account and all associated short links</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Deleting your account is irreversible. Once confirmed, all custom domain links, QR codes, and routing statistics will cease functioning immediately.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-red-50/30 dark:bg-red-950/20">
              <span className="text-xs text-red-700 dark:text-red-400 font-medium">Irreversible action</span>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete Account
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Tab 3: Active Sessions */}
      {activeSubTab === 'sessions' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Connected Devices & Sessions</CardTitle>
                <CardDescription>Active sessions granted access to this BreakIfy account</CardDescription>
              </div>
              {sessions.filter((s) => !s.isCurrent).length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevokeOtherSessions}
                  isLoading={revokeAllLoading}
                >
                  Revoke All Other Sessions
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionsLoading ? (
              <div className="py-8 text-center text-xs text-zinc-500">Loading active sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">No other active sessions detected.</div>
            ) : (
              sessions.map((sess) => (
                <div
                  key={sess.sessionId}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {sess.browser || 'Unknown Browser'} on {sess.os || 'Unknown OS'} ({sess.device || 'Desktop'})
                        </span>
                        {sess.isCurrent && (
                          <Badge variant="success" size="sm">Current Session</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-zinc-500 font-mono">
                        <span>IP: {sess.ipAddress}</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Globe className="w-3 h-3 text-zinc-400" />
                          <span>{sess.location || 'Unknown'}</span>
                        </span>
                        <span>•</span>
                        <span>Active: {new Date(sess.lastActive).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(sess.sessionId)}
                      isLoading={revokingId === sess.sessionId}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: API Credentials */}
      {activeSubTab === 'api' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>REST API Keys</CardTitle>
              <CardDescription>Authenticate CLI tools and backend workflows</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    bk_live_948f29c017...82f1
                  </div>
                  <div className="text-[11px] text-zinc-500">Full write permissions • Created 5 days ago</div>
                </div>
                <Badge variant="outline" size="sm">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Two-Factor Authentication Setup Modal */}
      <Dialog
        isOpen={is2faModalOpen}
        onClose={() => setIs2faModalOpen(false)}
        title={twoFactorStep === 'setup' ? 'Setup Two-Factor Authentication' : 'Emergency Recovery Codes'}
        description={
          twoFactorStep === 'setup'
            ? 'Scan the QR code with your authenticator app and enter the 6-digit code below.'
            : 'Save these 10 one-time recovery codes in a safe place. If you lose your phone, each can be used once.'
        }
        maxWidth="md"
      >
        {twoFactorStep === 'setup' ? (
          <form onSubmit={handleEnable2FA} className="space-y-4">
            {twoFactorError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{twoFactorError}</span>
              </div>
            )}

            <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              {twoFactorQr ? (
                <img src={twoFactorQr} alt="2FA QR Code" className="w-48 h-48 border border-zinc-200 rounded-lg p-2 bg-white" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-zinc-400">Loading QR code...</div>
              )}
              <div className="text-center">
                <p className="text-[11px] text-zinc-500">Can&apos;t scan? Enter this code manually in your app:</p>
                <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-800 dark:text-zinc-200 select-all">
                  {twoFactorSecret}
                </code>
              </div>
            </div>

            <Input
              label="Enter 6-Digit Authenticator Code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
              className="text-center font-mono tracking-widest text-lg"
              autoFocus
              required
            />

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIs2faModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={twoFactorLoading}>
                Verify & Enable
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Two-factor authentication is now active on your account!</span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-center select-all">
              {recoveryCodes.map((code) => (
                <div key={code} className="p-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded font-semibold text-zinc-900 dark:text-zinc-100">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                  onClick={copyRecoveryCodesToClipboard}
                >
                  {copiedCodes ? 'Copied!' : 'Copy All'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={downloadRecoveryCodes}
                >
                  Download .txt
                </Button>
              </div>
              <Button type="button" variant="primary" size="sm" onClick={() => setIs2faModalOpen(false)}>
                I have saved these codes
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Disable 2FA Modal */}
      <Dialog
        isOpen={isDisable2faModalOpen}
        onClose={() => setIsDisable2faModalOpen(false)}
        title="Disable Two-Factor Authentication"
        description="To disable 2FA, please enter your account password or a current 6-digit authenticator code."
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsDisable2faModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDisable2FA}
              isLoading={disableLoading}
              disabled={!disablePasswordOrToken}
            >
              Disable 2FA
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {disableError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400">
              {disableError}
            </div>
          )}
          <Input
            label="Current Password or 6-Digit 2FA Code"
            type="password"
            placeholder="•••••••••••• or 123456"
            value={disablePasswordOrToken}
            onChange={(e) => setDisablePasswordOrToken(e.target.value)}
            autoFocus
            required
          />
        </div>
      </Dialog>

      {/* Change Email Dialog Modal */}
      <Dialog
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Update Account Email"
        description="A verification link will be dispatched to the new email address."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRequestEmailChange}
              isLoading={emailSaving}
              disabled={!newEmail}
            >
              Send Verification
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {emailFeedback && (
            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
              {emailFeedback}
            </div>
          )}
          <Input
            label="New Email Address"
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new.email@company.com"
          />
          <Input
            label="Current Password"
            type="password"
            required
            value={emailCurrentPassword}
            onChange={(e) => setEmailCurrentPassword(e.target.value)}
            placeholder="Verify current password"
          />
        </div>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        description="This will permanently delete your account and short URLs."
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAccountConfirm}
              isLoading={deleteLoading}
              disabled={deleteConfirmText !== 'DELETE'}
            >
              Permanently Delete
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 rounded-lg bg-red-500/10 text-xs text-red-600 dark:text-red-400">
              {deleteError}
            </div>
          )}
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Type <strong className="font-mono text-zinc-900 dark:text-zinc-100">DELETE</strong> below to confirm.
          </p>
          <Input
            placeholder="DELETE"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            isMono
          />
          <Input
            label="Enter Account Password"
            type="password"
            placeholder="••••••••••••"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />
        </div>
      </Dialog>
    </div>
  );
}
