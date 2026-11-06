import { 
  SiteSettings, 
  User, 
  LegalDocument, 
  Discussion, 
  DiscussionComment, 
  AdminStats, 
  ChatHistoryEntry,
  ChatQuota
} from '../types';

const TOKEN_KEY = 'bawaslu_auth_token';
const GUEST_KEY = 'bawaslu_guest_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getGuestToken(): string {
  let token = localStorage.getItem(GUEST_KEY);
  if (!token) {
    token = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(GUEST_KEY, token);
  }
  return token;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const guestToken = getGuestToken();

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('x-guest-token', guestToken);

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    const errorMsg = json.error || json.message || 'Terjadi kesalahan sistem';
    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.code = json.code;
    err.data = json;
    throw err;
  }

  return json;
}

export const api = {
  // Settings
  getSettings: () => request<{ data: SiteSettings }>('/api/settings'),
  updateSettings: (settings: Partial<SiteSettings>) =>
    request<{ message: string; data: SiteSettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // Auth
  register: (data: any) =>
    request<{ message: string; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (identifier: string, password: string) =>
    request<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  getMe: () => request<{ user: User | null }>('/api/auth/me'),
  updateProfile: (data: any) =>
    request<{ message: string; user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Chat AI
  getChatQuota: () => request<ChatQuota>(`/api/chat/quota?guestToken=${getGuestToken()}`),
  askChatbot: (question: string) =>
    request<{
      data: {
        answer: string;
        legalBasis: string[];
        references: { title: string; link?: string; category: string }[];
        isFound: boolean;
        remaining: number;
        limit: number;
        isGuest: boolean;
      };
    }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ question, guestToken: getGuestToken() }),
    }),

  // Documents
  getDocuments: (params?: { category?: string; search?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);
    return request<{ data: LegalDocument[] }>(`/api/documents?${query.toString()}`);
  },
  getRecentDocuments: () => request<{ data: LegalDocument[] }>('/api/documents/recent'),
  getDocument: (id: string) => request<{ data: LegalDocument }>(`/api/documents/${id}`),
  createDocument: (data: any) =>
    request<{ message: string; data: LegalDocument }>('/api/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDocument: (id: string, data: any) =>
    request<{ message: string; data: LegalDocument }>(`/api/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteDocument: (id: string) =>
    request<{ message: string }>(`/api/documents/${id}`, {
      method: 'DELETE',
    }),
  toggleDocumentStatus: (id: string) =>
    request<{ message: string; data: LegalDocument }>(`/api/documents/${id}/toggle-status`, {
      method: 'PUT',
    }),

  // Forum
  getDiscussions: (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    return request<{ data: Discussion[] }>(`/api/forum/discussions?${query.toString()}`);
  },
  getDiscussion: (id: string) => request<{ data: Discussion & { comments: DiscussionComment[] } }>(`/api/forum/discussions/${id}`),
  createDiscussion: (data: { title: string; content: string; category: string }) =>
    request<{ message: string; data: Discussion }>('/api/forum/discussions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createComment: (discussionId: string, content: string) =>
    request<{ message: string; data: DiscussionComment }>(`/api/forum/discussions/${discussionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  reportContent: (data: { targetType: 'discussion' | 'comment'; targetId: string; reason: string }) =>
    request<{ message: string }>('/api/forum/report', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Admin
  getAdminStats: () => request<{ data: AdminStats }>('/api/admin/stats'),
  getAdminUsers: () => request<{ data: User[] }>('/api/admin/users'),
  updateUserStatus: (id: string, data: { status?: 'active' | 'inactive'; role?: 'admin' | 'user' }) =>
    request<{ message: string; data: User }>(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) => request<{ message: string }>(`/api/admin/users/${id}`, { method: 'DELETE' }),
  getChatHistory: () => request<{ data: ChatHistoryEntry[] }>('/api/admin/chat-history'),
  getModerationData: () => request<{ data: { discussions: Discussion[]; reports: any[] } }>('/api/admin/moderation'),
  updateDiscussionStatus: (id: string, status: 'active' | 'hidden') =>
    request<{ message: string }>(`/api/admin/moderation/discussion/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  deleteDiscussionAdmin: (id: string) =>
    request<{ message: string }>(`/api/admin/moderation/discussion/${id}`, { method: 'DELETE' }),
  deleteCommentAdmin: (id: string) =>
    request<{ message: string }>(`/api/admin/moderation/comment/${id}`, { method: 'DELETE' }),
  resolveReport: (id: string) =>
    request<{ message: string }>(`/api/admin/moderation/reports/${id}/resolve`, { method: 'PUT' }),
};
