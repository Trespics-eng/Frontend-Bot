import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Shield,
  CreditCard,
  LayoutDashboard,
  ShoppingBag,
  Plus,
  RefreshCw,
  Trash2,
  Sparkles,
  X,
  MessageSquare,
  AlertCircle,
  User,
  LogOut,
  Lock,
  MessageCircle,
  Edit3,
  QrCode,
  Copy,
  Check,
  Key,
} from 'lucide-react';
import {
  getSessionToken,
  getSessionUser,
  login,
  register,
  logout,
  getProfile,
  updateProfile,
  getAccounts,
  createAccount,
  activateBot,
  getAccountQR,
  getPairingCode,
  disconnectAccount,
  deleteAccount,
  getFeatures,
  getSubscriptions,
  getPayments,
  checkout,
  getAccountRules,
  createAccountRule,
  updateAccountRule,
  toggleAccountRule,
  deleteAccountRule,
  getFeatureSettings,
  updateFeatureSettings,
  submitFeedback,
  getMyFeedback,
  getAllFeedbackAdmin,
  updateFeedbackStatus,
  getAdminMetrics,
  getAdminCustomers,
  getAdminWhatsAppAccounts,
  getAdminPayments,
  updateCustomerRole,
} from './api/client';
import type {
  WhatsAppAccount,
  FeatureItem,
  SubscriptionItem,
  PaymentItem,
  UserProfile,
  AutoReplyRule,
  FeedbackItem,
  AdminMetrics,
  AdminWhatsAppAccount,
} from './api/client';

export default function App() {
  // ── Session State (Automatic Logout on Tab/Browser Close) ──
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getSessionUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(getSessionToken()));

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'numbers' | 'autoreply' | 'marketplace' | 'billing' | 'feedback' | 'profile' | 'admin'>('home');
  const [adminSubTab, setAdminSubTab] = useState<'overview' | 'whatsapp_numbers' | 'members' | 'payments' | 'feedbacks' | 'features'>('overview');

  // Application Data States
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Auto-Reply States
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [offlineMessage, setOfflineMessage] = useState('Hello! I am currently away. I will get back to you shortly.');
  const [savingOffline, setSavingOffline] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [ruleReplyText, setRuleReplyText] = useState('');
  const [ruleMatchType, setRuleMatchType] = useState<'contains' | 'exact' | 'regex' | 'starts_with'>('contains');
  const [ruleScope, setRuleScope] = useState<'all' | 'private' | 'group'>('all');

  // Feedback & Complaints States
  const [userFeedbacks, setUserFeedbacks] = useState<FeedbackItem[]>([]);
  const [fbType, setFbType] = useState<'feedback' | 'complaint'>('feedback');
  const [fbCategory, setFbCategory] = useState('general');
  const [fbSubject, setFbSubject] = useState('');
  const [fbMessage, setFbMessage] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);

  // Admin Data States
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics | null>(null);
  const [adminCustomers, setAdminCustomers] = useState<any[]>([]);
  const [adminWhatsAppAccounts, setAdminWhatsAppAccounts] = useState<AdminWhatsAppAccount[]>([]);
  const [adminPayments, setAdminPayments] = useState<PaymentItem[]>([]);
  const [adminFeedbacks, setAdminFeedbacks] = useState<FeedbackItem[]>([]);
  const [adminFeedbackFilter, setAdminFeedbackFilter] = useState<'all' | 'complaint' | 'feedback'>('all');
  const [adminReplyModal, setAdminReplyModal] = useState<FeedbackItem | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminReplyStatus, setAdminReplyStatus] = useState<'pending' | 'in_progress' | 'resolved'>('resolved');

  // Profile Edit States
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileEmailInput, setProfileEmailInput] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // WhatsApp Connect / QR Modal States
  const [qrModalAccount, setQrModalAccount] = useState<WhatsAppAccount | null>(null);
  const [pairingMethod, setPairingMethod] = useState<'qr' | 'code'>('qr');
  const [pairingPhoneInput, setPairingPhoneInput] = useState('');
  const [pairingCodeData, setPairingCodeData] = useState<{ code: string; expiresAt: number } | null>(null);
  const [pairingCodeLoading, setPairingCodeLoading] = useState(false);
  const [pairingCodeCopied, setPairingCodeCopied] = useState(false);
  const [qrData, setQrData] = useState<{ qrDataUrl: string | null; expiresAt?: number; hasQR: boolean; status?: string } | null>(null);
  const [refreshingQR, setRefreshingQR] = useState(false);
  const [addAccountModal, setAddAccountModal] = useState(false);
  const [newLabel, setNewLabel] = useState('My Business WhatsApp');
  const [newPhone, setNewPhone] = useState('');
  const [connectingPhone, setConnectingPhone] = useState(false);

  // Checkout Modal States
  const [checkoutModal, setCheckoutModal] = useState<{ feature: FeatureItem; account: WhatsAppAccount | null; period: 'weekly' | 'monthly' } | null>(null);
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);

  // Banners & Notifications
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // ── Load User & Account Data on Authentication ──
  const refreshUserData = async () => {
    try {
      const profRes = await getProfile();
      setCurrentUser(profRes.user);
      setProfileNameInput(profRes.user.fullName || '');
      setProfileEmailInput(profRes.user.email || '');

      const [accRes, featRes, subRes, payRes, fbRes] = await Promise.all([
        getAccounts().catch(() => []),
        getFeatures().catch(() => []),
        getSubscriptions().catch(() => []),
        getPayments().catch(() => []),
        getMyFeedback().catch(() => []),
      ]);

      setAccounts(accRes);
      setFeatures(featRes);
      setSubscriptions(subRes);
      setPayments(payRes);
      setUserFeedbacks(fbRes);

      if (accRes.length > 0) {
        const defaultAcc = accRes[0].id;
        setSelectedAccountId(defaultAcc);
        loadAutoReplyData(defaultAcc);
      }

      if (profRes.user.role === 'admin') {
        loadAdminData();
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const loadAutoReplyData = async (accId: string) => {
    if (!accId) return;
    try {
      const [accRules, settings] = await Promise.all([
        getAccountRules(accId),
        getFeatureSettings(accId, 'auto_reply'),
      ]);
      setRules(accRules);
      if (settings?.offline_message) {
        setOfflineMessage(settings.offline_message);
      }
    } catch (err) {
      console.error('Failed to load auto-reply rules:', err);
    }
  };

  const loadAdminData = async () => {
    try {
      const [m, c, wa, p, fb] = await Promise.all([
        getAdminMetrics().catch(() => null),
        getAdminCustomers().catch(() => []),
        getAdminWhatsAppAccounts().catch(() => []),
        getAdminPayments().catch(() => []),
        getAllFeedbackAdmin().catch(() => []),
      ]);
      if (m) setAdminMetrics(m);
      setAdminCustomers(c);
      setAdminWhatsAppAccounts(wa);
      setAdminPayments(p);
      setAdminFeedbacks(fb);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshUserData();
    }
  }, [isAuthenticated]);

  // Handle Account change for rules
  useEffect(() => {
    if (selectedAccountId) {
      loadAutoReplyData(selectedAccountId);
    }
  }, [selectedAccountId]);

  // ── QR Code Polling Effect ──
  useEffect(() => {
    if (!qrModalAccount) return;
    const fetchQR = async () => {
      try {
        const qrRes = await getAccountQR(qrModalAccount.id);
        setQrData(qrRes);
        if (qrRes.status === 'connected') {
          setBannerNotice(`🎉 Account "${qrModalAccount.label}" connected successfully!`);
          setQrModalAccount(null);
          const updated = await getAccounts();
          setAccounts(updated);
        }
      } catch (err) {
        console.error('QR fetch error:', err);
      }
    };

    fetchQR();
    const interval = setInterval(fetchQR, 5000);
    return () => clearInterval(interval);
  }, [qrModalAccount]);

  // ── Authentication Handlers ──
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const res = await login(authEmail, authPassword);
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setBannerNotice(`Welcome back, ${res.user.fullName || res.user.email}!`);
      } else {
        const res = await register(authEmail, authPassword, authFullName);
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        setBannerNotice(`Account created successfully! Welcome, ${res.user.fullName}!`);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setBannerNotice('You have been logged out securely.');
  };

  // ── Account & Bot Connection Handlers ──
  const handleAddAndConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel) return;
    setConnectingPhone(true);

    try {
      const res = await createAccount(newLabel, newPhone);
      const acc = res.account;
      setAddAccountModal(false);
      setNewLabel('My Business WhatsApp');
      setNewPhone('');

      // Immediately activate bot and trigger QR generation
      await activateBot(acc.id);
      setQrModalAccount(acc);
      const updated = await getAccounts();
      setAccounts(updated);
      setSelectedAccountId(acc.id);
    } catch (err: any) {
      alert(`Could not initialize WhatsApp connection: ${err.message}`);
    } finally {
      setConnectingPhone(false);
    }
  };

  const handleOpenQRModal = async (acc: WhatsAppAccount, method: 'qr' | 'code' = 'qr') => {
    setQrModalAccount(acc);
    setPairingMethod(method);
    setPairingPhoneInput(acc.phone_number || '');
    setPairingCodeData(null);
    setPairingCodeCopied(false);
    setQrData(null);
    await activateBot(acc.id);
  };

  const handleRequestPairingCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!qrModalAccount) return;
    const phone = pairingPhoneInput || qrModalAccount.phone_number;
    if (!phone) {
      alert('Please enter your phone number with country code (e.g. 254746278212).');
      return;
    }

    setPairingCodeLoading(true);
    try {
      const res = await getPairingCode(qrModalAccount.id, phone);
      if (res.success && res.pairingCode) {
        setPairingCodeData({ code: res.pairingCode, expiresAt: res.expiresAt });
      }
    } catch (err: any) {
      alert(`Could not generate pairing code: ${err.message}`);
    } finally {
      setPairingCodeLoading(false);
    }
  };

  const handleCopyPairingCode = () => {
    if (!pairingCodeData?.code) return;
    navigator.clipboard.writeText(pairingCodeData.code.replace(/-/g, ''));
    setPairingCodeCopied(true);
    setTimeout(() => setPairingCodeCopied(false), 2000);
  };

  const handleRefreshQR = async () => {
    if (!qrModalAccount) return;
    setRefreshingQR(true);
    try {
      setQrData(null);
      await activateBot(qrModalAccount.id, true);
      const qrRes = await getAccountQR(qrModalAccount.id);
      setQrData(qrRes);
    } catch (err: any) {
      console.error('Failed to regenerate QR code:', err);
    } finally {
      setRefreshingQR(false);
    }
  };

  const handleDisconnect = async (accId: string) => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp account?')) return;
    try {
      await disconnectAccount(accId);
      const updated = await getAccounts();
      setAccounts(updated);
      setBannerNotice('WhatsApp session disconnected.');
    } catch (err: any) {
      alert(`Error disconnecting: ${err.message}`);
    }
  };

  const handleDeleteAccount = async (accId: string) => {
    if (!confirm('Are you sure you want to delete this account record completely?')) return;
    try {
      await deleteAccount(accId);
      const updated = await getAccounts();
      setAccounts(updated);
      setBannerNotice('Account deleted successfully.');
    } catch (err: any) {
      alert(`Error deleting account: ${err.message}`);
    }
  };

  // ── Custom Auto-Reply Handlers ──
  const handleSaveOfflineMessage = async () => {
    if (!selectedAccountId) return;
    setSavingOffline(true);
    try {
      await updateFeatureSettings(selectedAccountId, 'auto_reply', {
        offline_message: offlineMessage,
      });
      setBannerNotice('✅ Custom offline reply message saved successfully!');
    } catch (err: any) {
      alert(`Failed to save offline message: ${err.message}`);
    } finally {
      setSavingOffline(false);
    }
  };

  const handleOpenAddRuleModal = () => {
    setEditingRule(null);
    setRuleKeyword('');
    setRuleReplyText('');
    setRuleMatchType('contains');
    setRuleScope('all');
    setRuleModalOpen(true);
  };

  const handleOpenEditRuleModal = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setRuleKeyword(rule.keyword);
    setRuleReplyText(rule.reply_text);
    setRuleMatchType(rule.match_type);
    setRuleScope(rule.scope);
    setRuleModalOpen(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !ruleKeyword || !ruleReplyText) return;

    try {
      if (editingRule) {
        await updateAccountRule(selectedAccountId, editingRule.id, {
          keyword: ruleKeyword,
          replyText: ruleReplyText,
          matchType: ruleMatchType,
          scope: ruleScope,
        });
        setBannerNotice(`✅ Rule "${ruleKeyword}" updated!`);
      } else {
        await createAccountRule(selectedAccountId, {
          keyword: ruleKeyword,
          replyText: ruleReplyText,
          matchType: ruleMatchType,
          scope: ruleScope,
          enabled: true,
        });
        setBannerNotice(`✅ Custom auto-reply rule for "${ruleKeyword}" created!`);
      }
      setRuleModalOpen(false);
      loadAutoReplyData(selectedAccountId);
    } catch (err: any) {
      alert(`Failed to save rule: ${err.message}`);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    if (!selectedAccountId) return;
    try {
      await toggleAccountRule(selectedAccountId, ruleId);
      loadAutoReplyData(selectedAccountId);
    } catch (err: any) {
      alert(`Failed to toggle rule: ${err.message}`);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Delete this auto reply rule?')) return;
    try {
      await deleteAccountRule(selectedAccountId, ruleId);
      loadAutoReplyData(selectedAccountId);
      setBannerNotice('Rule deleted.');
    } catch (err: any) {
      alert(`Failed to delete rule: ${err.message}`);
    }
  };

  // ── Profile Edit Handler ──
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await updateProfile({
        fullName: profileNameInput,
        email: profileEmailInput,
      });
      setCurrentUser(res.user);
      setBannerNotice('✅ Profile updated successfully!');
    } catch (err: any) {
      alert(`Failed to update profile: ${err.message}`);
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Feedback Submission Handler ──
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbSubject || !fbMessage) return;
    setFbSubmitting(true);
    try {
      await submitFeedback({
        type: fbType,
        category: fbCategory,
        subject: fbSubject,
        message: fbMessage,
      });
      setFbSubject('');
      setFbMessage('');
      setBannerNotice(`Thank you! Your ${fbType} has been submitted to administration.`);
      const updated = await getMyFeedback();
      setUserFeedbacks(updated);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setFbSubmitting(false);
    }
  };

  // ── Admin Feedback Resolution Handler ──
  const handleAdminResolveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyModal) return;
    try {
      await updateFeedbackStatus(adminReplyModal.id, adminReplyStatus, adminReplyText);
      setBannerNotice(`Updated ${adminReplyModal.type} #${adminReplyModal.id.slice(0, 8)} status.`);
      setAdminReplyModal(null);
      setAdminReplyText('');
      const updated = await getAllFeedbackAdmin();
      setAdminFeedbacks(updated);
    } catch (err: any) {
      alert(`Failed to update feedback: ${err.message}`);
    }
  };

  // ── Checkout M-Pesa Handler ──
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutModal || !checkoutModal.account) return;
    setCheckoutStatus('Sending STK push to your Safaricom phone...');

    try {
      const res = await checkout({
        accountId: checkoutModal.account.id,
        featureCode: checkoutModal.feature.code,
        period: checkoutModal.period,
        paymentMethod: 'mpesa',
        phoneNumber: checkoutPhone,
      });

      if (res.success) {
        setCheckoutStatus('📱 STK Prompt sent! Enter your M-Pesa PIN on your phone to complete.');
        setTimeout(async () => {
          setCheckoutModal(null);
          setCheckoutStatus(null);
          setBannerNotice('🎉 Payment received! Feature activated for your WhatsApp account.');
          refreshUserData();
        }, 5000);
      }
    } catch (err: any) {
      setCheckoutStatus(`❌ Error: ${err.message}`);
    }
  };

  // =========================================================================
  // VIEW: 1. AUTHENTICATION (LOGIN / REGISTER) SCREEN
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(circle at 50% 20%, #111a2e 0%, #070a12 100%)' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '40px 32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
          {/* Logo / Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '16px' }}>
              <Smartphone size={36} color="#10b981" />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              WhatsApp SaaS Suite
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Multi-Number Bot Management, Anti-Delete & Custom Automations
            </p>
          </div>

          {/* Session Notice */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '24px' }}>
            <Lock size={16} color="#60a5fa" />
            <span style={{ fontSize: '12px', color: '#93c5fd' }}>
              <strong>Browser Session Active:</strong> Closing your browser tab automatically logs you out for security.
            </span>
          </div>

          {/* Toggle Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'login' ? '#10b981' : 'transparent',
                color: authMode === 'login' ? '#ffffff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(null); }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: authMode === 'register' ? '#10b981' : 'transparent',
                color: authMode === 'register' ? '#ffffff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {authError && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {authMode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Ndwiga"
                  value={authFullName}
                  onChange={(e) => setAuthFullName(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', fontSize: '14px', outline: 'none' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Email Address</label>
              <input
                type="email"
                required
                placeholder="name@business.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              style={{
                marginTop: '8px',
                padding: '13px',
                borderRadius: '10px',
                border: 'none',
                background: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '15px',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              {authLoading ? 'Authenticating...' : authMode === 'login' ? 'Sign In to Dashboard' : 'Register & Start 7-Day Free Trial'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 2. MAIN DASHBOARD APPLICATION
  // =========================================================================
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="app-container">
      {/* ── SIDEBAR NAVIGATION ── */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Smartphone size={24} color="#10b981" />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>BotManager</h2>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>
              {isAdmin ? '👑 Administrator' : '🟢 Customer Portal'}
            </span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <button
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
            style={navBtnStyle(activeTab === 'home')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard Overview</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'numbers' ? 'active' : ''}`}
            onClick={() => setActiveTab('numbers')}
            style={navBtnStyle(activeTab === 'numbers')}
          >
            <Smartphone size={18} />
            <span>WhatsApp Numbers ({accounts.length}/3)</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'autoreply' ? 'active' : ''}`}
            onClick={() => setActiveTab('autoreply')}
            style={navBtnStyle(activeTab === 'autoreply')}
          >
            <MessageSquare size={18} />
            <span>Custom Auto-Reply</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'marketplace' ? 'active' : ''}`}
            onClick={() => setActiveTab('marketplace')}
            style={navBtnStyle(activeTab === 'marketplace')}
          >
            <ShoppingBag size={18} />
            <span>Marketplace & Plans</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
            style={navBtnStyle(activeTab === 'billing')}
          >
            <CreditCard size={18} />
            <span>Billing & Invoices</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
            style={navBtnStyle(activeTab === 'feedback')}
          >
            <MessageCircle size={18} />
            <span>Feedback & Complains</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            style={navBtnStyle(activeTab === 'profile')}
          >
            <User size={18} />
            <span>My Profile</span>
          </button>

          {/* Admin Exclusive Tab */}
          {isAdmin && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', paddingLeft: '8px', marginBottom: '8px', display: 'block' }}>
                ADMIN CONTROL
              </span>
              <button
                className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => { setActiveTab('admin'); loadAdminData(); }}
                style={{
                  ...navBtnStyle(activeTab === 'admin'),
                  background: activeTab === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.05)',
                  borderColor: activeTab === 'admin' ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                }}
              >
                <Shield size={18} color="#ef4444" />
                <span>Admin Suite</span>
              </button>
            </div>
          )}
        </nav>

        {/* User Card & Prominent Logout at bottom of sidebar */}
        <div style={{ paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', overflow: 'hidden' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isAdmin ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '14px', flexShrink: 0 }}>
              {currentUser?.fullName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.fullName || 'User'}
              </p>
              <p style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="main-content">
        {/* Top Header Bar with prominent Logout Button */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'rgba(18, 24, 38, 0.75)', backdropFilter: 'blur(16px)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Account:</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
              {currentUser?.fullName || currentUser?.email}
            </span>
            <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', background: isAdmin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: isAdmin ? '#f87171' : '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
              {isAdmin ? '👑 Administrator (John Warui)' : 'Customer'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} />
            <span>Log Out</span>
          </button>
        </header>
        {/* Banner Notification */}
        {bannerNotice && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{bannerNotice}</span>
            </div>
            <button onClick={() => setBannerNotice(null)} style={{ background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: HOME OVERVIEW                                             */}
        {/* ================================================================= */}
        {activeTab === 'home' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Dashboard Overview</h1>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Welcome back, {currentUser?.fullName || currentUser?.email}. Here is your live WhatsApp bot activity.
                </p>
              </div>
              <button
                onClick={() => setAddAccountModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderRadius: '10px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}
              >
                <Plus size={18} />
                <span>Connect New WhatsApp</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>WhatsApp Numbers</span>
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', margin: '8px 0' }}>{accounts.length} / 3</p>
                <span style={{ fontSize: '12px', color: '#10b981' }}>{accounts.filter(a => a.status === 'connected').length} Active & Connected</span>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>Active Auto-Reply Rules</span>
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', margin: '8px 0' }}>{rules.length}</p>
                <span style={{ fontSize: '12px', color: '#60a5fa' }}>Custom keyword automations</span>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>My Trial Status</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', margin: '14px 0 8px 0' }}>7-Day Free Trial</p>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Full bundle access active</span>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>Session Security</span>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#60a5fa', margin: '14px 0 8px 0' }}>Session-Only</p>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Auto-logout on browser close</span>
              </div>
            </div>

            {/* Connected Numbers List */}
            <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Your WhatsApp Accounts</h3>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Maximum limit of 3 numbers enforced</span>
              </div>

              {accounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Smartphone size={40} color="#64748b" style={{ marginBottom: '12px' }} />
                  <p style={{ color: '#cbd5e1', fontSize: '15px', fontWeight: 600 }}>No WhatsApp numbers connected yet.</p>
                  <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>Enter your phone number to pair your WhatsApp account via QR code.</p>
                  <button onClick={() => setAddAccountModal(true)} style={{ padding: '10px 18px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                    Connect First Number
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {accounts.map((acc) => (
                    <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: acc.status === 'connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Smartphone size={22} color={acc.status === 'connected' ? '#10b981' : '#f59e0b'} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{acc.label}</h4>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: acc.status === 'connected' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: acc.status === 'connected' ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                              {acc.status === 'connected' ? 'CONNECTED' : 'ACTION REQUIRED'}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                            Phone: {acc.phone_number || acc.liveStatus?.phoneNumber || 'Pending QR Scan'}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {acc.status !== 'connected' && (
                          <button
                            onClick={() => handleOpenQRModal(acc)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            <RefreshCw size={14} />
                            <span>Scan QR Code</span>
                          </button>
                        )}
                        {acc.status === 'connected' && (
                          <button
                            onClick={() => handleDisconnect(acc.id)}
                            style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Disconnect
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAccount(acc.id)}
                          style={{ padding: '8px', borderRadius: '8px', background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer' }}
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: WHATSAPP NUMBERS & QR CODE CONNECT (TASK 7)               */}
        {/* ================================================================= */}
        {activeTab === 'numbers' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>WhatsApp Numbers & Devices</h1>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Register up to 3 WhatsApp phone numbers. Each number gets an isolated pairing QR code to connect to your bot.
                </p>
              </div>
              <button
                onClick={() => setAddAccountModal(true)}
                disabled={accounts.length >= 3}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderRadius: '10px', background: accounts.length >= 3 ? '#475569' : '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px', cursor: accounts.length >= 3 ? 'not-allowed' : 'pointer' }}
              >
                <Plus size={18} />
                <span>Add Number ({accounts.length}/3)</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {accounts.map((acc) => (
                <div key={acc.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: acc.status === 'connected' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: acc.status === 'connected' ? '#34d399' : '#fbbf24' }}>
                        {acc.status.toUpperCase()}
                      </span>
                      <button onClick={() => handleDeleteAccount(acc.id)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h3 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '4px' }}>{acc.label}</h3>
                    <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '18px' }}>
                      {acc.phone_number ? `+${acc.phone_number}` : 'No phone assigned yet'}
                    </p>

                    <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', fontSize: '12px', color: '#cbd5e1', marginBottom: '20px' }}>
                      <p><strong>Bot Status:</strong> {acc.status === 'connected' ? 'Active & Processing Messages' : 'Requires QR Pairing'}</p>
                      <p style={{ marginTop: '4px' }}><strong>Auto-Reply:</strong> Active</p>
                      <p style={{ marginTop: '4px' }}><strong>Anti-Delete:</strong> Active</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {acc.status !== 'connected' ? (
                      <button
                        onClick={() => handleOpenQRModal(acc)}
                        style={{ flex: 1, padding: '11px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <RefreshCw size={14} />
                        <span>Pair WhatsApp (QR Code)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDisconnect(acc.id)}
                        style={{ flex: 1, padding: '11px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                      >
                        Disconnect Bot
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: CUSTOM AUTO-REPLY MANAGER (TASK 3)                        */}
        {/* ================================================================= */}
        {activeTab === 'autoreply' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Custom Auto-Reply Manager</h1>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Write your own custom automated responses without restrictions. Configure keyword triggers, match patterns, and custom away messages.
                </p>
              </div>
              <button
                onClick={handleOpenAddRuleModal}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderRadius: '10px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)' }}
              >
                <Plus size={18} />
                <span>Add Custom Reply Rule</span>
              </button>
            </div>

            {/* Account Selector */}
            {accounts.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>Select WhatsApp Account:</span>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', fontSize: '13px' }}
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.label} ({a.phone_number || 'No phone'})</option>
                  ))}
                </select>
              </div>
            )}

            {/* 1. Custom Offline / Away Message Editor */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px' }}>Custom Away & Offline Auto-Reply</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '14px' }}>
                This message will be sent automatically to customers who message your number when your status is set to Away or Offline.
              </p>
              <textarea
                rows={3}
                value={offlineMessage}
                onChange={(e) => setOfflineMessage(e.target.value)}
                placeholder="Type your custom offline greeting..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#ffffff', fontSize: '14px', resize: 'vertical', outline: 'none', marginBottom: '12px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSaveOfflineMessage}
                  disabled={savingOffline}
                  style={{ padding: '9px 18px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  {savingOffline ? 'Saving...' : 'Save Offline Message'}
                </button>
              </div>
            </div>

            {/* 2. Custom Keyword Rules Table */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Custom Keyword Rules</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>Keywords and phrases that trigger your customized automated responses.</p>
                </div>
              </div>

              {rules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <MessageSquare size={36} color="#64748b" style={{ marginBottom: '8px' }} />
                  <p style={{ color: '#cbd5e1', fontSize: '14px' }}>No rules created yet.</p>
                  <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '14px' }}>Create custom rules to automatically answer common questions.</p>
                  <button onClick={handleOpenAddRuleModal} style={{ padding: '8px 16px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    Create First Rule
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {rules.map((rule) => (
                    <div key={rule.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ flex: 1, paddingRight: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>"{rule.keyword}"</span>
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>
                            {rule.match_type}
                          </span>
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1' }}>
                            Scope: {rule.scope}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#e2e8f0', background: 'rgba(0, 0, 0, 0.25)', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                          {rule.reply_text}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: rule.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: rule.enabled ? '#34d399' : '#fca5a5',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </button>
                        <button
                          onClick={() => handleOpenEditRuleModal(rule)}
                          style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', color: '#94a3b8', border: 'none', cursor: 'pointer' }}
                          title="Edit Rule"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          style={{ padding: '6px 10px', borderRadius: '6px', background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                          title="Delete Rule"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: MARKETPLACE & SUBSCRIPTIONS                               */}
        {/* ================================================================= */}
        {activeTab === 'marketplace' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Feature Marketplace & Plans</h1>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Purchase individual bot features or the All-In-One Full Pass with automated instant M-Pesa billing.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {features.map((feat) => {
                const weeklyPrice = feat.feature_prices.find(p => p.period === 'weekly')?.amount_minor || 10;
                const monthlyPrice = feat.feature_prices.find(p => p.period === 'monthly')?.amount_minor || 40;

                return (
                  <div
                    key={feat.id}
                    className="glass-panel"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: feat.is_bundle ? '2px solid rgba(16, 185, 129, 0.4)' : undefined,
                    }}
                  >
                    <div>
                      {feat.is_bundle && (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#10b981', color: '#fff', textTransform: 'uppercase', marginBottom: '12px', display: 'inline-block' }}>
                          MOST POPULAR BUNDLE
                        </span>
                      )}
                      <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>{feat.name}</h3>
                      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', minHeight: '50px' }}>
                        {feat.description}
                      </p>

                      <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Weekly Pass</span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>KES {weeklyPrice}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>Monthly Pass (Best Value)</span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>KES {monthlyPrice}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setCheckoutModal({
                            feature: feat,
                            account: accounts[0] || null,
                            period: 'weekly',
                          });
                        }}
                        style={{ flex: 1, padding: '9px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Buy Weekly
                      </button>
                      <button
                        onClick={() => {
                          setCheckoutModal({
                            feature: feat,
                            account: accounts[0] || null,
                            period: 'monthly',
                          });
                        }}
                        style={{ flex: 1, padding: '9px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Buy Monthly
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: BILLING & PAYMENT HISTORY                                 */}
        {/* ================================================================= */}
        {activeTab === 'billing' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Billing & Invoices</h1>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                View your active subscription passes and M-Pesa transaction history.
              </p>
            </div>

            {/* Active Subscriptions */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Active Subscription Passes</h3>
              {subscriptions.length === 0 ? (
                <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', fontSize: '13px' }}>
                  <strong>⭐ 7-Day All-In-One Free Trial Active:</strong> You currently have full access to all bot features across your registered accounts.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {subscriptions.map((sub) => (
                    <div key={sub.id} style={{ padding: '16px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>{sub.plan_period} PASS</span>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '4px 0' }}>{sub.feature_code}</h4>
                      <p style={{ fontSize: '12px', color: '#94a3b8' }}>Account: {sub.whatsapp_accounts?.label || 'All'}</p>
                      <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>Status: {sub.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Payment Receipts</h3>
              {payments.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>No payments recorded yet. Active under 7-Day Free Trial.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Receipt / Ref</th>
                        <th style={{ padding: '12px' }}>Amount</th>
                        <th style={{ padding: '12px' }}>Phone</th>
                        <th style={{ padding: '12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '12px' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '12px', fontFamily: 'monospace', color: '#38bdf8' }}>{p.provider_tx_ref || 'PENDING'}</td>
                          <td style={{ padding: '12px', fontWeight: 700 }}>KES {p.amount_minor}</td>
                          <td style={{ padding: '12px' }}>{p.payer_phone || '—'}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '11px', fontWeight: 600 }}>
                              {p.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: FEEDBACK & COMPLAINS (USER VIEW - TASK 6)                 */}
        {/* ================================================================= */}
        {activeTab === 'feedback' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Feedback & Complains</h1>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                We value your input. Submit bug reports, service complaints, or feature suggestions directly to administration.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Submission Form */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Submit a Ticket</h3>
                <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Submission Type</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setFbType('feedback')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: fbType === 'feedback' ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        💡 Suggestion / Feedback
                      </button>
                      <button
                        type="button"
                        onClick={() => setFbType('complaint')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: 'none',
                          background: fbType === 'complaint' ? '#ef4444' : 'rgba(255, 255, 255, 0.05)',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ⚠️ Lodge Complaint
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Category</label>
                    <select
                      value={fbCategory}
                      onChange={(e) => setFbCategory(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '13px' }}
                    >
                      <option value="bot_connection">WhatsApp QR / Connection</option>
                      <option value="auto_reply">Custom Auto-Reply Rules</option>
                      <option value="billing">M-Pesa Payment / Billing</option>
                      <option value="stickers">Stickers & Media Tools</option>
                      <option value="general">General Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Brief summary of your issue or suggestion"
                      value={fbSubject}
                      onChange={(e) => setFbSubject(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Detailed Message</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Provide full details so we can resolve your issue swiftly..."
                      value={fbMessage}
                      onChange={(e) => setFbMessage(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '13px', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={fbSubmitting}
                    style={{ padding: '12px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginTop: '6px' }}
                  >
                    {fbSubmitting ? 'Submitting...' : 'Send to Administration'}
                  </button>
                </form>
              </div>

              {/* My Submissions History */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>My Submitted Tickets</h3>
                {userFeedbacks.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '13px' }}>You haven't submitted any complaints or feedback yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto' }}>
                    {userFeedbacks.map((item) => (
                      <div key={item.id} style={{ padding: '16px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: item.type === 'complaint' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: item.type === 'complaint' ? '#f87171' : '#34d399', textTransform: 'uppercase' }}>
                            {item.type}
                          </span>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: item.status === 'resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: item.status === 'resolved' ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{item.subject}</h4>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>{item.message}</p>
                        {item.admin_response && (
                          <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', borderLeft: '3px solid #38bdf8' }}>
                            <p style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, marginBottom: '2px' }}>Admin Response:</p>
                            <p style={{ fontSize: '12px', color: '#cbd5e1' }}>{item.admin_response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 7: PROFILE SETTINGS & EDIT (TASK 4)                          */}
        {/* ================================================================= */}
        {activeTab === 'profile' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>My Account Profile</h1>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Manage your user details, email preferences, and view platform permissions.
              </p>
            </div>

            <div style={{ maxWidth: '640px' }} className="glass-panel">
              <div style={{ padding: '32px' }}>
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Account ID</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser?.id || ''}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)', color: '#64748b', fontSize: '13px', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileNameInput}
                      onChange={(e) => setProfileNameInput(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#ffffff', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileEmailInput}
                      onChange={(e) => setProfileEmailInput(e.target.value)}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#ffffff', fontSize: '14px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>User Role</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', background: isAdmin ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: isAdmin ? '#f87171' : '#34d399', fontWeight: 700 }}>
                        {currentUser?.role.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {isAdmin ? 'System Administrator privileges enabled.' : 'Standard commercial customer.'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    style={{ marginTop: '10px', padding: '12px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                  >
                    {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 8: ADMIN CONTROL PANEL (ADMIN ONLY - TASK 6)                 */}
        {/* ================================================================= */}
        {activeTab === 'admin' && isAdmin && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>👑 Administration Control Center</h1>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Privileged admin overview: Customer records, revenue transactions, system metrics, and all user complains.
                </p>
              </div>
              <button
                onClick={loadAdminData}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.08)', color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer' }}
              >
                <RefreshCw size={14} />
                <span>Refresh Data</span>
              </button>
            </div>

            {/* Admin Sub-Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setAdminSubTab('overview')}
                style={adminTabBtnStyle(adminSubTab === 'overview')}
              >
                Platform Metrics
              </button>
              <button
                onClick={() => setAdminSubTab('whatsapp_numbers')}
                style={adminTabBtnStyle(adminSubTab === 'whatsapp_numbers')}
              >
                📱 WhatsApp Numbers ({adminWhatsAppAccounts.length})
              </button>
              <button
                onClick={() => setAdminSubTab('members')}
                style={adminTabBtnStyle(adminSubTab === 'members')}
              >
                Members & Users ({adminCustomers.length})
              </button>
              <button
                onClick={() => setAdminSubTab('payments')}
                style={adminTabBtnStyle(adminSubTab === 'payments')}
              >
                Payment Records ({adminPayments.length})
              </button>
              <button
                onClick={() => setAdminSubTab('feedbacks')}
                style={adminTabBtnStyle(adminSubTab === 'feedbacks')}
              >
                Complaints & Feedback ({adminFeedbacks.length})
              </button>
              <button
                onClick={() => setAdminSubTab('features')}
                style={adminTabBtnStyle(adminSubTab === 'features')}
              >
                All Features Catalog ({features.length})
              </button>
            </div>

            {/* Sub-View: Overview Metrics */}
            {adminSubTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Total Registered Customers</span>
                  <p style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: '8px 0' }}>{adminMetrics?.totalCustomers ?? adminCustomers.length}</p>
                </div>
                <div className="glass-panel" style={{ padding: '24px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setAdminSubTab('whatsapp_numbers')}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Total WhatsApp Numbers</span>
                  <p style={{ fontSize: '32px', fontWeight: 800, color: '#fff', margin: '8px 0' }}>{adminMetrics?.totalWhatsAppAccounts ?? adminWhatsAppAccounts.length}</p>
                  <span style={{ fontSize: '11px', color: '#38bdf8' }}>Click to view all →</span>
                </div>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Live Connected Sessions</span>
                  <p style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', margin: '8px 0' }}>{adminMetrics?.liveConnectedSessions ?? 0}</p>
                </div>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Active Subscriptions</span>
                  <p style={{ fontSize: '32px', fontWeight: 800, color: '#a78bfa', margin: '8px 0' }}>{adminMetrics?.activeSubscriptions ?? 0}</p>
                </div>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Total Revenue (KES)</span>
                  <p style={{ fontSize: '32px', fontWeight: 800, color: '#38bdf8', margin: '8px 0' }}>
                    KES {adminMetrics?.totalRevenueKES ?? 0}
                  </p>
                </div>
              </div>
            )}

            {/* Sub-View: All WhatsApp Numbers */}
            {adminSubTab === 'whatsapp_numbers' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>📱 All WhatsApp Numbers Across All Customers</h3>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{adminWhatsAppAccounts.length} total numbers</span>
                </div>
                {adminWhatsAppAccounts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                    <Smartphone size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ fontSize: '14px' }}>No WhatsApp numbers registered yet.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                          <th style={{ padding: '12px' }}>#</th>
                          <th style={{ padding: '12px' }}>Phone Number</th>
                          <th style={{ padding: '12px' }}>Label</th>
                          <th style={{ padding: '12px' }}>Owner</th>
                          <th style={{ padding: '12px' }}>Owner Email</th>
                          <th style={{ padding: '12px' }}>Status</th>
                          <th style={{ padding: '12px' }}>Live Status</th>
                          <th style={{ padding: '12px' }}>Connected At</th>
                          <th style={{ padding: '12px' }}>Last Seen</th>
                          <th style={{ padding: '12px' }}>Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminWhatsAppAccounts.map((acc, idx) => {
                          const statusColors: Record<string, { bg: string; text: string }> = {
                            connected: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
                            disconnected: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
                            pending: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
                            qr_ready: { bg: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8' },
                            connecting: { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc' },
                            error: { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171' },
                            needs_reauthentication: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
                            suspended: { bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af' },
                          };
                          const sColor = statusColors[acc.status] || statusColors.pending;
                          const liveColor = acc.liveStatus ? (statusColors[acc.liveStatus.status] || statusColors.pending) : null;
                          return (
                            <tr key={acc.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <td style={{ padding: '12px', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                              <td style={{ padding: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#e2e8f0' }}>
                                {acc.phone_number ? `+${acc.phone_number}` : '—'}
                              </td>
                              <td style={{ padding: '12px', fontWeight: 600 }}>{acc.label}</td>
                              <td style={{ padding: '12px' }}>{acc.profiles?.full_name || '—'}</td>
                              <td style={{ padding: '12px', color: '#94a3b8', fontSize: '12px' }}>{acc.profiles?.email || '—'}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: '12px', background: sColor.bg, color: sColor.text, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                                  {acc.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                {liveColor ? (
                                  <span style={{ padding: '2px 8px', borderRadius: '12px', background: liveColor.bg, color: liveColor.text, fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
                                    {acc.liveStatus!.status}
                                  </span>
                                ) : (
                                  <span style={{ color: '#64748b', fontSize: '11px' }}>N/A</span>
                                )}
                              </td>
                              <td style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>
                                {acc.connected_at ? new Date(acc.connected_at).toLocaleString() : '—'}
                              </td>
                              <td style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>
                                {acc.last_seen_at ? new Date(acc.last_seen_at).toLocaleString() : '—'}
                              </td>
                              <td style={{ padding: '12px', fontSize: '12px', color: '#94a3b8' }}>
                                {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-View: Members / Users */}
            {adminSubTab === 'members' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Registered Customers & Members</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                        <th style={{ padding: '12px' }}>Customer Name</th>
                        <th style={{ padding: '12px' }}>Email</th>
                        <th style={{ padding: '12px' }}>Role</th>
                        <th style={{ padding: '12px' }}>WhatsApp Accounts</th>
                        <th style={{ padding: '12px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminCustomers.map((cust) => (
                        <tr key={cust.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{cust.full_name || 'Anonymous User'}</td>
                          <td style={{ padding: '12px' }}>{cust.email}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '12px', background: cust.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: cust.role === 'admin' ? '#f87171' : '#34d399', fontSize: '11px', fontWeight: 600 }}>
                              {cust.role.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {cust.whatsapp_accounts?.map((w: any) => (
                              <span key={w.id} style={{ display: 'inline-block', fontSize: '11px', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '4px', marginRight: '4px' }}>
                                {w.label} ({w.status})
                              </span>
                            )) || 'None'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <button
                              onClick={async () => {
                                const newRole = cust.role === 'admin' ? 'customer' : 'admin';
                                await updateCustomerRole(cust.id, newRole);
                                loadAdminData();
                              }}
                              style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', color: '#cbd5e1', border: 'none', fontSize: '11px', cursor: 'pointer' }}
                            >
                              Toggle Role
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-View: Payment Records */}
            {adminSubTab === 'payments' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Complete Payment Records (Audit Log)</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Payer Phone</th>
                        <th style={{ padding: '12px' }}>M-Pesa Reference</th>
                        <th style={{ padding: '12px' }}>Customer / Email</th>
                        <th style={{ padding: '12px' }}>Amount (KES)</th>
                        <th style={{ padding: '12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminPayments.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '12px' }}>{new Date(p.created_at).toLocaleString()}</td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{p.payer_phone || '—'}</td>
                          <td style={{ padding: '12px', fontFamily: 'monospace', color: '#38bdf8' }}>{p.provider_tx_ref || 'PENDING'}</td>
                          <td style={{ padding: '12px' }}>{p.profiles?.email || 'Customer'}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#10b981' }}>KES {p.amount_minor}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '11px', fontWeight: 600 }}>
                              {p.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-View: Complaints & User Feedbacks */}
            {adminSubTab === 'feedbacks' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Complaints & Feedback Central</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setAdminFeedbackFilter('all')}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: adminFeedbackFilter === 'all' ? '#10b981' : 'rgba(255, 255, 255, 0.05)', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setAdminFeedbackFilter('complaint')}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: adminFeedbackFilter === 'complaint' ? '#ef4444' : 'rgba(255, 255, 255, 0.05)', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Complaints Only
                    </button>
                    <button
                      onClick={() => setAdminFeedbackFilter('feedback')}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: adminFeedbackFilter === 'feedback' ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Feedback Only
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {adminFeedbacks
                    .filter(f => adminFeedbackFilter === 'all' || f.type === adminFeedbackFilter)
                    .map((item) => (
                      <div key={item.id} style={{ padding: '18px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: item.type === 'complaint' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: item.type === 'complaint' ? '#f87171' : '#34d399', textTransform: 'uppercase' }}>
                              {item.type}
                            </span>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>From: {item.user_email}</span>
                          </div>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: item.status === 'resolved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: item.status === 'resolved' ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{item.subject}</h4>
                        <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '10px' }}>{item.message}</p>

                        {item.admin_response && (
                          <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.08)', borderLeft: '3px solid #38bdf8', marginBottom: '10px' }}>
                            <p style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>Your Admin Reply:</p>
                            <p style={{ fontSize: '12px', color: '#e2e8f0' }}>{item.admin_response}</p>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setAdminReplyModal(item);
                            setAdminReplyText(item.admin_response || '');
                            setAdminReplyStatus(item.status);
                          }}
                          style={{ padding: '6px 12px', borderRadius: '6px', background: '#38bdf8', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Respond & Update Status
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Sub-View: All Features Catalog */}
            {adminSubTab === 'features' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Platform Features Catalog</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {features.map(f => (
                    <div key={f.id} style={{ padding: '16px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{f.name}</h4>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{f.description}</p>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>CODE: {f.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: PAIRING MODAL (QR CODE & PHONE LINKING)                            */}
      {/* ========================================================================= */}
      {qrModalAccount && (
        <div style={modalBackdropStyle}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '28px 24px', textAlign: 'center', position: 'relative' }}>
            <button
              onClick={() => setQrModalAccount(null)}
              style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)', marginBottom: '10px' }}>
              <Smartphone size={26} color="#10b981" />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>Connect WhatsApp Bot</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Account: <strong>{qrModalAccount.label}</strong> {qrModalAccount.phone_number ? `(+${qrModalAccount.phone_number})` : ''}
            </p>

            {/* Method Switcher Tabs */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '10px', marginBottom: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                type="button"
                onClick={() => setPairingMethod('qr')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: pairingMethod === 'qr' ? '#10b981' : 'transparent',
                  color: pairingMethod === 'qr' ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.2s ease',
                }}
              >
                <QrCode size={14} />
                <span>Scan QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => setPairingMethod('code')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: pairingMethod === 'code' ? '#10b981' : 'transparent',
                  color: pairingMethod === 'code' ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.2s ease',
                }}
              >
                <Key size={14} />
                <span>Link with Phone Number</span>
              </button>
            </div>

            {pairingMethod === 'qr' ? (
              <div>
                {/* QR Code Container */}
                <div style={{ background: '#ffffff', padding: '14px', borderRadius: '16px', display: 'inline-block', marginBottom: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  {qrData?.qrDataUrl ? (
                    <img src={qrData.qrDataUrl} alt="WhatsApp QR Code" style={{ width: '210px', height: '210px', display: 'block' }} />
                  ) : (
                    <div style={{ width: '210px', height: '210px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
                      <RefreshCw size={28} className="animate-spin" />
                      <p style={{ fontSize: '12px', marginTop: '8px', fontWeight: 600 }}>Loading 1 Stable QR...</p>
                    </div>
                  )}
                </div>

                {/* Step-by-Step Instructions */}
                <div style={{ textAlign: 'left', background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '10px', fontSize: '12px', color: '#cbd5e1', marginBottom: '14px' }}>
                  <p><strong>1.</strong> Open WhatsApp on your phone</p>
                  <p style={{ marginTop: '4px' }}><strong>2.</strong> Tap <strong>Settings</strong> or <strong>Menu (⋮)</strong> &gt; <strong>Linked Devices</strong></p>
                  <p style={{ marginTop: '4px' }}><strong>3.</strong> Tap <strong>Link a Device</strong> and point your camera here</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <button
                    type="button"
                    onClick={handleRefreshQR}
                    disabled={refreshingQR}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: refreshingQR ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <RefreshCw size={12} className={refreshingQR ? 'animate-spin' : ''} />
                    <span>{refreshingQR ? 'Regenerating QR...' : 'Regenerate Fresh QR Code'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Link With Phone Number Tab */}
                <form onSubmit={handleRequestPairingCode} style={{ marginBottom: '16px' }}>
                  <div style={{ textAlign: 'left', marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                      WhatsApp Phone Number (with Country Code)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 254746278212 or 14155552671"
                      value={pairingPhoneInput}
                      onChange={(e) => setPairingPhoneInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={pairingCodeLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: pairingCodeLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {pairingCodeLoading ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                    <span>{pairingCodeLoading ? 'Requesting Code from WhatsApp...' : 'Get 8-Digit Pairing Code'}</span>
                  </button>
                </form>

                {pairingCodeData && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
                    <p style={{ fontSize: '11px', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '6px' }}>
                      Enter This Code On Your Phone:
                    </p>
                    <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '6px', color: '#ffffff', fontFamily: 'monospace', margin: '8px 0' }}>
                      {pairingCodeData.code}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPairingCode}
                      style={{
                        background: pairingCodeCopied ? '#10b981' : 'rgba(255, 255, 255, 0.12)',
                        border: 'none',
                        color: '#ffffff',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginTop: '4px',
                      }}
                    >
                      {pairingCodeCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{pairingCodeCopied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                    </button>
                  </div>
                )}

                {/* Step-by-Step Phone Pairing Instructions */}
                <div style={{ textAlign: 'left', background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '10px', fontSize: '12px', color: '#cbd5e1', marginBottom: '14px' }}>
                  <p><strong>1.</strong> Open WhatsApp on your phone</p>
                  <p style={{ marginTop: '4px' }}><strong>2.</strong> Tap <strong>Settings</strong> or <strong>Menu (⋮)</strong> &gt; <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong></p>
                  <p style={{ marginTop: '4px' }}><strong>3.</strong> Tap <strong>"Link with phone number instead"</strong> at the bottom</p>
                  <p style={{ marginTop: '4px' }}><strong>4.</strong> Enter the 8-digit code shown above</p>
                </div>
              </div>
            )}

            <p style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
              <RefreshCw size={12} className="animate-spin" /> Auto-detecting WhatsApp connection...
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD WHATSAPP NUMBER MODAL                                          */}
      {/* ========================================================================= */}
      {addAccountModal && (
        <div style={modalBackdropStyle}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '19px', fontWeight: 800 }}>Connect WhatsApp Number</h3>
              <button onClick={() => setAddAccountModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAndConnectAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Account Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Department or Main Hotlines"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>WhatsApp Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 254712345678 or 0712345678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', fontSize: '14px' }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  A QR code will be generated immediately after creating this account.
                </span>
              </div>

              <button
                type="submit"
                disabled={connectingPhone}
                style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                {connectingPhone ? 'Initializing...' : 'Proceed to QR Scan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT AUTO REPLY RULE MODAL (TASK 3)                          */}
      {/* ========================================================================= */}
      {ruleModalOpen && (
        <div style={modalBackdropStyle}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '19px', fontWeight: 800 }}>
                {editingRule ? 'Edit Auto-Reply Rule' : 'Create Custom Auto-Reply Rule'}
              </h3>
              <button onClick={() => setRuleModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Trigger Keyword / Phrase</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. price, order status, or hello|hi"
                  value={ruleKeyword}
                  onChange={(e) => setRuleKeyword(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Match Pattern Type</label>
                <select
                  value={ruleMatchType}
                  onChange={(e: any) => setRuleMatchType(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', fontSize: '13px' }}
                >
                  <option value="contains">Contains Keyword (Flexible)</option>
                  <option value="exact">Exact Match</option>
                  <option value="starts_with">Starts With</option>
                  <option value="regex">Regular Expression (Advanced)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Applies To (Scope)</label>
                <select
                  value={ruleScope}
                  onChange={(e: any) => setRuleScope(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', fontSize: '13px' }}
                >
                  <option value="all">All Chats (Private & Groups)</option>
                  <option value="private">Private Direct Messages Only</option>
                  <option value="group">Group Chats Only</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Custom Auto-Reply Message (Unrestricted)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write the exact custom reply the bot should send..."
                  value={ruleReplyText}
                  onChange={(e) => setRuleReplyText(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                {editingRule ? 'Update Rule' : 'Save New Rule'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADMIN RESOLVE FEEDBACK / COMPLAINT MODAL (TASK 6)                  */}
      {/* ========================================================================= */}
      {adminReplyModal && (
        <div style={modalBackdropStyle}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Respond to {adminReplyModal.type}</h3>
              <button onClick={() => setAdminReplyModal(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
              Subject: <strong>{adminReplyModal.subject}</strong> (From: {adminReplyModal.user_email})
            </p>

            <form onSubmit={handleAdminResolveFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Ticket Status</label>
                <select
                  value={adminReplyStatus}
                  onChange={(e: any) => setAdminReplyStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', fontSize: '13px' }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress / Under Review</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Admin Response / Note</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your official answer or resolution to the user..."
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', background: '#38bdf8', color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Save Response & Update
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: M-PESA CHECKOUT MODAL                                              */}
      {/* ========================================================================= */}
      {checkoutModal && (
        <div style={modalBackdropStyle}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '19px', fontWeight: 800 }}>M-Pesa Express Checkout</h3>
              <button onClick={() => setCheckoutModal(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', marginBottom: '18px' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{checkoutModal.feature.name}</p>
              <p style={{ fontSize: '13px', color: '#10b981', marginTop: '4px' }}>
                Plan: {checkoutModal.period.toUpperCase()} PASS
              </p>
            </div>

            {checkoutStatus && (
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '13px', marginBottom: '16px' }}>
                {checkoutStatus}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Safaricom M-Pesa Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="2547XXXXXXXX"
                  value={checkoutPhone}
                  onChange={(e) => setCheckoutPhone(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.12)', color: '#fff', fontSize: '14px' }}
                />
              </div>

              <button
                type="submit"
                style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Trigger M-Pesa STK Push
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline Helper Styles ──
function navBtnStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1px solid transparent',
    background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
    borderColor: isActive ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
    color: isActive ? '#34d399' : '#94a3b8',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  };
}

function adminTabBtnStyle(isActive: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: isActive ? '#ef4444' : 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  };
}

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  zIndex: 100,
};
