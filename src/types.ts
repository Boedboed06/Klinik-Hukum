export type DocumentCategory = 'UU Pemilu' | 'Perbawaslu' | 'PKPU' | 'Peraturan Terkait';

export interface DocumentChunk {
  id: string;
  pasal?: string;
  bab?: string;
  text: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  regulationNumber: string;
  year: string;
  description: string;
  googleDriveLink: string;
  fileUrl?: string;
  publishDate: string;
  status: 'active' | 'inactive';
  processStatus: 'Menunggu' | 'Sedang diproses' | 'Berhasil' | 'Gagal';
  errorMessage?: string;
  content: string;
  chunks: DocumentChunk[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  agency: string;
  birthDate: string;
  birthYear: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface DiscussionComment {
  id: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'user';
  authorAgency?: string;
  content: string;
  createdAt: string;
  status: 'active' | 'hidden';
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  authorAgency?: string;
  createdAt: string;
  status: 'active' | 'hidden';
  reportCount: number;
  commentsCount: number;
  comments?: DiscussionComment[];
}

export interface ContentReport {
  id: string;
  targetType: 'discussion' | 'comment';
  targetId: string;
  reason: string;
  reportedBy: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

export interface SiteSettings {
  appName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  bannerHeadline: string;
  bannerSubline: string;
  officeAddress: string;
  contactPhone: string;
  contactEmail: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  fallbackMessage: string;
  guestQuestionLimit: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'awasmin';
  text: string;
  timestamp: string;
  legalBasis?: string[];
  references?: { title: string; link?: string; category: string }[];
  isFound?: boolean;
}

export interface ChatQuota {
  isGuest: boolean;
  isUnlimited: boolean;
  remaining: number;
  limit: number;
  currentCount?: number;
}

export interface AdminStats {
  totalUsers: number;
  totalChatbotQuestions: number;
  totalDocuments: number;
  totalDiscussions: number;
  totalComments: number;
  recentDocuments: LegalDocument[];
  recentDiscussions: Discussion[];
}

export interface ChatHistoryEntry {
  id: string;
  userId?: string;
  userType: 'guest' | 'user' | 'admin';
  guestToken?: string;
  question: string;
  answer: string;
  legalBasis: string[];
  references: string[];
  isFound: boolean;
  createdAt: string;
}
