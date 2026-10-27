export interface WhatsAppAccount {
  id: string;
  phone_number: string | null;
  label: string;
  status: 'pending' | 'connecting' | 'qr_ready' | 'connected' | 'disconnected' | 'needs_reauthentication' | 'error' | 'suspended';
  connected_at: string | null;
  liveStatus?: {
    status: string;
    hasQR: boolean;
    phoneNumber?: string;
    pairingCode?: string | null;
  };
  entitlements?: Record<string, { entitled: boolean; reason: string; expiresAt: string | null } | undefined>;
}

export interface FeaturePrice {
  id: string;
  period: 'weekly' | 'monthly';
  duration_days: number;
  amount_minor: number;
  currency: string;
}

export interface FeatureItem {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  is_bundle: boolean;
  feature_prices: FeaturePrice[];
}

export interface SubscriptionItem {
  id: string;
  feature_code: string;
  plan_period: string;
  status: string;
  amount_minor: number;
  currency: string;
  start_at: string;
  end_at: string;
  whatsapp_accounts?: {
    id: string;
    label: string;
    phone_number: string | null;
  };
}

export interface PaymentItem {
  id: string;
  provider: 'mpesa' | 'card';
  provider_tx_ref: string | null;
  amount_minor: number;
  currency: string;
  status: string;
  payer_phone: string | null;
  created_at: string;
  profiles?: {
    email: string;
    full_name: string;
  };
  orders?: {
    feature_code: string;
    plan_period: string;
    whatsapp_accounts?: {
      label: string;
      phone_number: string | null;
    };
  };
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'customer' | 'admin';
  trialStartedAt: string | null;
  trialExpiresAt: string | null;
  trialUsed: boolean;
}

export interface AutoReplyRule {
  id: string;
  whatsapp_account_id: string;
  keyword: string;
  reply_text: string;
  match_type: 'contains' | 'exact' | 'regex' | 'starts_with';
  case_sensitive: boolean;
  scope: 'all' | 'private' | 'group';
  enabled: boolean;
  created_at?: string;
}

export interface FeedbackItem {
  id: string;
  user_id: string;
  user_email: string;
  type: 'feedback' | 'complaint';
  category: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved';
  admin_response?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface AdminMetrics {
  totalCustomers: number;
  totalWhatsAppAccounts: number;
  liveConnectedSessions: number;
  activeSubscriptions: number;
  totalRevenueKES: number;
}

export interface AdminWhatsAppAccount {
  id: string;
  user_id: string;
  phone_number: string | null;
  label: string;
  status: string;
  connected_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  profiles?: {
    id: string;
    email: string;
    full_name: string;
  };
  liveStatus?: {
    status: string;
    hasQR: boolean;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// ── Session Token Management (Session-Only Storage) ──
// When user closes their browser or tab, sessionStorage is completely cleared by the browser automatically.
export function getSessionToken(): string | null {
  return sessionStorage.getItem('auth_session_token');
}

export function getSessionUser(): UserProfile | null {
  const stored = sessionStorage.getItem('auth_session_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setSession(token: string, user: UserProfile) {
  sessionStorage.setItem('auth_session_token', token);
  sessionStorage.setItem('auth_session_user', JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem('auth_session_token');
  sessionStorage.removeItem('auth_session_user');
}

// Safe wrapper around fetch
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getSessionToken() || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

// ── Authentication API ──

export async function login(email: string, password: string): Promise<{ success: boolean; token: string; user: UserProfile }> {
  const res = await apiRequest<{ success: boolean; token: string; user: UserProfile }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setSession(res.token, res.user);
  return res;
}

export async function register(
  email: string,
  password: string,
  fullName: string
): Promise<{ success: boolean; token: string; user: UserProfile }> {
  const res = await apiRequest<{ success: boolean; token: string; user: UserProfile }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
  });
  setSession(res.token, res.user);
  return res;
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {}
  clearSession();
}

// ── User Profile API ──

export async function getProfile(): Promise<{ success: boolean; user: UserProfile }> {
  const res = await apiRequest<{ success: boolean; user: UserProfile }>('/me');
  if (res.user) {
    const token = getSessionToken() || '';
    setSession(token, res.user);
  }
  return res;
}

export async function updateProfile(payload: { fullName?: string; email?: string }): Promise<{ success: boolean; user: UserProfile }> {
  const res = await apiRequest<{ success: boolean; user: UserProfile }>('/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const token = getSessionToken() || '';
  setSession(token, res.user);
  return res;
}

// ── WhatsApp Accounts API ──

export async function getAccounts(): Promise<WhatsAppAccount[]> {
  const res = await apiRequest<{ success: boolean; accounts: WhatsAppAccount[] }>('/accounts');
  return res.accounts;
}

export async function createAccount(label: string, phoneNumber?: string) {
  return apiRequest<{ success: boolean; account: WhatsAppAccount }>('/accounts', {
    method: 'POST',
    body: JSON.stringify({ label, phoneNumber }),
  });
}

export async function activateBot(accountId: string, force: boolean = false) {
  return apiRequest<{ success: boolean; status: any }>(`/accounts/${accountId}/activate${force ? '?force=true' : ''}`, {
    method: 'POST',
    body: JSON.stringify({ force }),
  });
}

export async function getAccountQR(accountId: string) {
  return apiRequest<{ success: boolean; hasQR: boolean; qrDataUrl: string | null; status: string; expiresAt?: number }>(
    `/accounts/${accountId}/qr`
  );
}

export async function getPairingCode(accountId: string, phoneNumber?: string) {
  return apiRequest<{
    success: boolean;
    pairingCode: string;
    phoneNumber: string;
    expiresAt: number;
  }>(`/accounts/${accountId}/pairing-code`, {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  });
}

export async function disconnectAccount(accountId: string) {
  return apiRequest<{ success: boolean; status: string }>(`/accounts/${accountId}/disconnect`, {
    method: 'POST',
  });
}

export async function deleteAccount(accountId: string) {
  return apiRequest<{ success: boolean }>(`/accounts/${accountId}`, {
    method: 'DELETE',
  });
}

// ── Custom Auto-Reply Rules & Settings API ──

export async function getAccountRules(accountId: string): Promise<AutoReplyRule[]> {
  const res = await apiRequest<{ success: boolean; rules: AutoReplyRule[] }>(`/features/${accountId}/rules`);
  return res.rules;
}

export async function createAccountRule(
  accountId: string,
  ruleData: {
    keyword: string;
    replyText: string;
    matchType?: 'contains' | 'exact' | 'regex' | 'starts_with';
    caseSensitive?: boolean;
    scope?: 'all' | 'private' | 'group';
    enabled?: boolean;
  }
): Promise<{ success: boolean; rule: AutoReplyRule }> {
  return apiRequest<{ success: boolean; rule: AutoReplyRule }>(`/features/${accountId}/rules`, {
    method: 'POST',
    body: JSON.stringify(ruleData),
  });
}

export async function updateAccountRule(
  accountId: string,
  ruleId: string,
  ruleData: Partial<{
    keyword: string;
    replyText: string;
    matchType: 'contains' | 'exact' | 'regex' | 'starts_with';
    caseSensitive: boolean;
    scope: 'all' | 'private' | 'group';
    enabled: boolean;
  }>
): Promise<{ success: boolean; rule: AutoReplyRule }> {
  return apiRequest<{ success: boolean; rule: AutoReplyRule }>(`/features/${accountId}/rules/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(ruleData),
  });
}

export async function toggleAccountRule(accountId: string, ruleId: string): Promise<{ success: boolean; enabled: boolean }> {
  return apiRequest<{ success: boolean; enabled: boolean }>(`/features/${accountId}/rules/${ruleId}/toggle`, {
    method: 'PATCH',
  });
}

export async function deleteAccountRule(accountId: string, ruleId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/features/${accountId}/rules/${ruleId}`, {
    method: 'DELETE',
  });
}

export async function getFeatureSettings(accountId: string, featureCode: string): Promise<Record<string, any>> {
  const res = await apiRequest<{ success: boolean; settings: Record<string, any> }>(
    `/features/${accountId}/features/${featureCode}/settings`
  );
  return res.settings;
}

export async function updateFeatureSettings(accountId: string, featureCode: string, settings: Record<string, any>) {
  return apiRequest<{ success: boolean; settings: Record<string, any> }>(
    `/features/${accountId}/features/${featureCode}/settings`,
    {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    }
  );
}

// ── Feedback & Complaints API ──

export async function submitFeedback(payload: {
  type: 'feedback' | 'complaint';
  subject: string;
  message: string;
  category?: string;
}): Promise<{ success: boolean; feedback: FeedbackItem }> {
  return apiRequest<{ success: boolean; feedback: FeedbackItem }>('/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMyFeedback(): Promise<FeedbackItem[]> {
  const res = await apiRequest<{ success: boolean; items: FeedbackItem[] }>('/feedback/my');
  return res.items;
}

export async function getAllFeedbackAdmin(): Promise<FeedbackItem[]> {
  const res = await apiRequest<{ success: boolean; items: FeedbackItem[] }>('/feedback/all');
  return res.items;
}

export async function updateFeedbackStatus(id: string, status: 'pending' | 'in_progress' | 'resolved', adminResponse?: string) {
  return apiRequest<{ success: boolean; feedback: any }>(`/feedback/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminResponse }),
  });
}

// ── Admin Management API ──

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const res = await apiRequest<{ success: boolean; metrics: AdminMetrics }>('/admin/metrics');
  return res.metrics;
}

export async function getAdminCustomers(): Promise<any[]> {
  const res = await apiRequest<{ success: boolean; customers: any[] }>('/admin/customers');
  return res.customers;
}

export async function getAdminWhatsAppAccounts(): Promise<AdminWhatsAppAccount[]> {
  const res = await apiRequest<{ success: boolean; accounts: AdminWhatsAppAccount[] }>('/admin/whatsapp-accounts');
  return res.accounts;
}

export async function getAdminPayments(): Promise<PaymentItem[]> {
  const res = await apiRequest<{ success: boolean; payments: PaymentItem[] }>('/admin/payments');
  return res.payments;
}

export async function updateCustomerRole(customerId: string, role: 'customer' | 'admin') {
  return apiRequest(`/admin/customers/${customerId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

// ── Feature Catalog & Subscriptions ──

export async function getFeatures(): Promise<FeatureItem[]> {
  const res = await apiRequest<{ success: boolean; features: FeatureItem[] }>('/features');
  return res.features;
}

export async function checkout(params: {
  accountId: string;
  featureCode: string;
  period: 'weekly' | 'monthly';
  paymentMethod: 'mpesa' | 'card';
  phoneNumber?: string;
}) {
  return apiRequest<{
    success: boolean;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    payment?: {
      checkoutRequestId?: string;
      message?: string;
      status: string;
    };
  }>('/checkout', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getSubscriptions(): Promise<SubscriptionItem[]> {
  const res = await apiRequest<{ success: boolean; subscriptions: SubscriptionItem[] }>('/subscriptions');
  return res.subscriptions;
}

export async function getPayments(): Promise<PaymentItem[]> {
  const res = await apiRequest<{ success: boolean; payments: PaymentItem[] }>('/subscriptions/payments');
  return res.payments;
}
