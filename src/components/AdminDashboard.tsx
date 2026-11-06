import React, { useState, useEffect } from 'react';
import { User, SiteSettings, LegalDocument, Discussion, AdminStats, ChatHistoryEntry } from '../types';
import { api } from '../services/api';
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  Image as ImageIcon, 
  Settings, 
  Users, 
  MessageSquare, 
  Bot, 
  History, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ExternalLink, 
  Check, 
  ShieldCheck, 
  Scale, 
  Sparkles, 
  Send,
  Flag,
  FileCheck2,
  RefreshCw,
  Search
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  settings: SiteSettings;
  onSettingsUpdated: (newSettings: SiteSettings) => void;
  onExitAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  settings,
  onSettingsUpdated,
  onExitAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'documents'
    | 'ai_sources'
    | 'banner_logo'
    | 'website_settings'
    | 'users'
    | 'moderation'
    | 'ai_settings'
    | 'chat_history'
  >('dashboard');

  // Stats & data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatHistoryEntry[]>([]);
  const [moderationDiscussions, setModerationDiscussions] = useState<Discussion[]>([]);
  const [moderationReports, setModerationReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings form
  const [editSettings, setEditSettings] = useState<SiteSettings>({ ...settings });

  // Document add/edit modal state
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<'UU Pemilu' | 'Perbawaslu' | 'PKPU' | 'Peraturan Terkait'>('UU Pemilu');
  const [docRegNumber, setDocRegNumber] = useState('');
  const [docYear, setDocYear] = useState(new Date().getFullYear().toString());
  const [docDesc, setDocDesc] = useState('');
  const [docDriveLink, setDocDriveLink] = useState('');
  const [docPublishDate, setDocPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [docStatus, setDocStatus] = useState<'active' | 'inactive'>('active');
  const [docContent, setDocContent] = useState('');

  // AI Sandbox Tester
  const [sandboxPrompt, setSandboxPrompt] = useState('');
  const [sandboxResult, setSandboxResult] = useState<any | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // Search in admin lists
  const [searchDocQuery, setSearchDocQuery] = useState('');

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const loadAllAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, docsRes, usersRes, logsRes, modRes] = await Promise.all([
        api.getAdminStats(),
        api.getDocuments(),
        api.getAdminUsers(),
        api.getChatHistory(),
        api.getModerationData(),
      ]);

      setStats(statsRes.data);
      setDocuments(docsRes.data);
      setUsersList(usersRes.data);
      setChatLogs(logsRes.data);
      setModerationDiscussions(modRes.data.discussions);
      setModerationReports(modRes.data.reports);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      showNotification('error', 'Gagal memuat data administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- SAVE SETTINGS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateSettings(editSettings);
      onSettingsUpdated(res.data);
      showNotification('success', 'Pengaturan website berhasil disimpan!');
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menyimpan pengaturan.');
    }
  };

  // --- SAVE DOCUMENT (ADD OR EDIT) ---
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: docTitle,
        category: docCategory,
        regulationNumber: docRegNumber,
        year: docYear,
        description: docDesc,
        googleDriveLink: docDriveLink,
        publishDate: docPublishDate,
        status: docStatus,
        content: docContent,
      };

      if (editingDocId) {
        await api.updateDocument(editingDocId, payload);
        showNotification('success', 'Dokumen dan basis pengetahuan AI berhasil diperbarui!');
      } else {
        await api.createDocument(payload);
        showNotification('success', 'Dokumen baru berhasil ditambahkan dan di-chunk ke basis pengetahuan AI!');
      }

      setDocModalOpen(false);
      resetDocForm();
      loadAllAdminData();
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menyimpan dokumen.');
    }
  };

  const resetDocForm = () => {
    setEditingDocId(null);
    setDocTitle('');
    setDocCategory('UU Pemilu');
    setDocRegNumber('');
    setDocYear(new Date().getFullYear().toString());
    setDocDesc('');
    setDocDriveLink('');
    setDocPublishDate(new Date().toISOString().split('T')[0]);
    setDocStatus('active');
    setDocContent('');
  };

  const handleOpenEditDoc = (doc: LegalDocument) => {
    setEditingDocId(doc.id);
    setDocTitle(doc.title);
    setDocCategory(doc.category);
    setDocRegNumber(doc.regulationNumber);
    setDocYear(doc.year);
    setDocDesc(doc.description || '');
    setDocDriveLink(doc.googleDriveLink || '');
    setDocPublishDate(doc.publishDate || '');
    setDocStatus(doc.status);
    setDocContent(doc.content || '');
    setDocModalOpen(true);
  };

  const handleDeleteDoc = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus dokumen ini dari sistem dan indeks AI?')) return;
    try {
      await api.deleteDocument(id);
      showNotification('success', 'Dokumen berhasil dihapus.');
      loadAllAdminData();
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menghapus dokumen.');
    }
  };

  const handleToggleDocStatus = async (id: string) => {
    try {
      await api.toggleDocumentStatus(id);
      showNotification('success', 'Status dokumen berhasil diubah.');
      loadAllAdminData();
    } catch (err: any) {
      showNotification('error', 'Gagal mengubah status dokumen.');
    }
  };

  // --- USER OPERATIONS ---
  const handleToggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateUserStatus(user.id, { status: newStatus });
      showNotification('success', `Status pengguna diubah menjadi ${newStatus}.`);
      loadAllAdminData();
    } catch (err: any) {
      showNotification('error', 'Gagal mengubah status pengguna.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus pengguna ini?')) return;
    try {
      await api.deleteUser(id);
      showNotification('success', 'Pengguna berhasil dihapus.');
      loadAllAdminData();
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menghapus pengguna.');
    }
  };

  // --- MODERATION OPERATIONS ---
  const handleToggleDiscussionStatus = async (disc: Discussion) => {
    const newStatus = disc.status === 'active' ? 'hidden' : 'active';
    try {
      await api.updateDiscussionStatus(disc.id, newStatus);
      showNotification('success', `Status diskusi diubah menjadi ${newStatus}.`);
      loadAllAdminData();
    } catch (err: any) {
      showNotification('error', 'Gagal memoderasi diskusi.');
    }
  };

  const handleDeleteDiscussion = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus diskusi ini beserta seluruh komentarnya?')) return;
    try {
      await api.deleteDiscussionAdmin(id);
      showNotification('success', 'Diskusi berhasil dihapus.');
      loadAllAdminData();
    } catch (err: any) {
      showNotification('error', 'Gagal menghapus diskusi.');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await api.resolveReport(reportId);
      showNotification('success', 'Laporan ditandai selesai.');
      loadAllAdminData();
    } catch (err: any) {
      showNotification('error', 'Gagal menyelesaikan laporan.');
    }
  };

  // --- TEST CHATBOT SANDBOX ---
  const handleTestSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxPrompt.trim()) return;

    setSandboxLoading(true);
    setSandboxResult(null);

    try {
      const res = await api.askChatbot(sandboxPrompt);
      setSandboxResult(res.data);
    } catch (err: any) {
      setSandboxResult({
        answer: 'Terjadi error pada pengujian AI: ' + err.message,
        isFound: false,
        legalBasis: [],
        references: [],
      });
    } finally {
      setSandboxLoading(false);
    }
  };

  const navMenuItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'documents', label: 'Manajemen Dokumen', icon: FileText },
    { id: 'ai_sources', label: 'Sumber Pengetahuan AI', icon: Database },
    { id: 'banner_logo', label: 'Manajemen Banner & Logo', icon: ImageIcon },
    { id: 'website_settings', label: 'Pengaturan Website', icon: Settings },
    { id: 'users', label: 'Manajemen Pengguna', icon: Users },
    { id: 'moderation', label: 'Moderasi Forum & Diskusi', icon: MessageSquare },
    { id: 'ai_settings', label: 'Pengaturan AI & Sandbox', icon: Bot },
    { id: 'chat_history', label: 'Riwayat Chatbot', icon: History },
  ];

  const filteredDocs = documents.filter((d) => {
    if (!searchDocQuery) return true;
    const q = searchDocQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.regulationNumber.toLowerCase().includes(q) ||
      d.year.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-stone-100/80 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-gradient-to-b from-stone-900 to-red-950 text-white flex-shrink-0 flex flex-col justify-between border-r border-red-900/40">
        <div>
          {/* Admin Header info */}
          <div className="p-6 border-b border-red-900/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-700 flex items-center justify-center font-bold text-amber-300 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold tracking-wide uppercase text-amber-400">
                  Panel Administrator
                </h2>
                <p className="text-xs text-stone-300 truncate max-w-[160px]">
                  {currentUser.fullName}
                </p>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1">
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                    isActive
                      ? 'bg-red-700 text-white shadow-md'
                      : 'text-stone-300 hover:bg-stone-800/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-stone-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Exit Button */}
        <div className="p-4 border-t border-red-900/30 space-y-2">
          <button
            onClick={onExitAdmin}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-red-900/80 text-white text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar ke Tampilan Pengguna</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-h-screen">
        {/* Toast Notification */}
        {feedbackMsg && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center justify-between text-sm font-semibold shadow-md ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-red-100 text-red-900 border border-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <Check className="w-5 h-5 text-emerald-700" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-700" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD UTAMA */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Dashboard Statistik Klinik Hukum
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Ringkasan data operasional sistem konsultasi hukum kepemiluan Bawaslu Kota Batam.
              </p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">Pengguna Terdaftar</div>
                <div className="text-2xl sm:text-3xl font-black text-red-700 mt-2">
                  {stats?.totalUsers || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Akun masyarakat & admin</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">Pertanyaan Chatbot</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
                  {stats?.totalChatbotQuestions || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Konsultasi ke Awasmin AI</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">Dokumen Regulasi</div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  {stats?.totalDocuments || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">UU, Perbawaslu, PKPU</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">Topik Diskusi</div>
                <div className="text-2xl sm:text-3xl font-black text-red-800 mt-2">
                  {stats?.totalDiscussions || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Topik forum aktif</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">Total Komentar</div>
                <div className="text-2xl sm:text-3xl font-black text-stone-800 mt-2">
                  {stats?.totalComments || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Tanggapan masyarakat</div>
              </div>
            </div>

            {/* Recent Documents Table in Dashboard */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-700" />
                  <span>Dokumen yang Terakhir Ditambahkan</span>
                </h3>
                <button
                  onClick={() => setActiveTab('documents')}
                  className="text-xs font-bold text-red-700 hover:underline"
                >
                  Kelola Semua Dokumen →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-slate-600 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4">Judul Dokumen</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Nomor/Tahun</th>
                      <th className="py-3 px-4">Status RAG</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {documents.slice(0, 5).map((doc) => (
                      <tr key={doc.id} className="hover:bg-stone-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                          {doc.title}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                            {doc.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {doc.regulationNumber}/{doc.year}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            ✓ {doc.processStatus || 'Berhasil'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              doc.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {doc.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MANAJEMEN DOKUMEN */}
        {/* ========================================================= */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Manajemen Dokumen & Regulasi
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Tambah, sunting, aktifkan/nonaktifkan, dan hapus peraturan hukum resmi Bawaslu Kota Batam.
                </p>
              </div>

              <button
                onClick={() => {
                  resetDocForm();
                  setDocModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs sm:text-sm shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Dokumen Baru</span>
              </button>
            </div>

            {/* Search Filter */}
            <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400 ml-2" />
              <input
                type="text"
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                placeholder="Cari berdasarkan judul, kategori, nomor, atau tahun peraturan..."
                className="w-full text-xs sm:text-sm focus:outline-none bg-transparent"
              />
            </div>

            {/* Documents Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-slate-600 uppercase font-bold">
                    <tr>
                      <th className="py-3.5 px-4">Judul Dokumen</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4">Nomor & Tahun</th>
                      <th className="py-3.5 px-4">Link Drive</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-stone-50/60">
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="font-bold text-slate-900 leading-snug">{doc.title}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {doc.description}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                            {doc.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          No. {doc.regulationNumber} / {doc.year}
                        </td>
                        <td className="py-3.5 px-4">
                          {doc.googleDriveLink ? (
                            <a
                              href={doc.googleDriveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-700 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <span>Drive</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleDocStatus(doc.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                              doc.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                            }`}
                          >
                            {doc.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditDoc(doc)}
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 transition"
                              title="Edit Dokumen"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition"
                              title="Hapus Dokumen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SUMBER PENGETAHUAN AI (RAG INSPECTOR) */}
        {/* ========================================================= */}
        {activeTab === 'ai_sources' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Sumber Pengetahuan AI (RAG Knowledge Base)
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Tinjau ekstraksi teks, segmentasi pasal (chunking), dan indeks pencarian semantik untuk Asisten Cerdas Awasmin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">Dokumen Terindeks</div>
                <div className="text-3xl font-black text-emerald-700 mt-2">
                  {documents.filter((d) => d.status === 'active').length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Aktif sebagai rujukan hukum</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">Total Bagian Pasal (Chunks)</div>
                <div className="text-3xl font-black text-red-700 mt-2">
                  {documents.reduce((acc, d) => acc + (d.chunks?.length || 0), 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Siap dicocokkan semantik</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="text-xs font-bold text-slate-500 uppercase">Status Ekstraksi Otomatis</div>
                <div className="text-3xl font-black text-amber-600 mt-2">Berhasil (100%)</div>
                <div className="text-[11px] text-slate-400 mt-1">Format naskah hukum valid</div>
              </div>
            </div>

            {/* Knowledge base items */}
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-xs font-extrabold bg-red-100 text-red-800">
                        {doc.category}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {doc.title} (No. {doc.regulationNumber}/{doc.year})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        Status: {doc.processStatus || 'Berhasil'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                        {doc.chunks?.length || 0} Chunks
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">{doc.description}</p>

                  {/* Chunks preview pills */}
                  <div className="pt-3 border-t border-stone-100">
                    <div className="text-xs font-bold text-slate-600 mb-2">
                      Cuplikan Pasal / Segmentasi:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {doc.chunks?.slice(0, 6).map((chunk, cIdx) => (
                        <div
                          key={cIdx}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 text-slate-700 text-xs border border-stone-200 max-w-xs truncate"
                          title={chunk.text}
                        >
                          <span className="font-bold text-red-800 mr-1">{chunk.pasal || `Bagian ${cIdx + 1}`}:</span>
                          {chunk.text.slice(0, 40)}...
                        </div>
                      ))}
                      {(doc.chunks?.length || 0) > 6 && (
                        <span className="text-xs text-slate-400 self-center">
                          +{doc.chunks.length - 6} bagian lainnya
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MANAJEMEN BANNER & LOGO */}
        {/* ========================================================= */}
        {activeTab === 'banner_logo' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Manajemen Banner & Logo Website
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Ganti logo dan banner utama secara instan tanpa perlu mengubah kode program aplikasi. Mendukung format JPG, JPEG, dan PNG.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Logo Setting */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-red-700" />
                  <span>Logo Klinik Hukum Bawaslu Batam</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Logo (JPG, JPEG, PNG, SVG)
                  </label>
                  <input
                    type="url"
                    value={editSettings.logoUrl}
                    onChange={(e) => setEditSettings({ ...editSettings, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo-bawaslu.png (kosongkan untuk menggunakan emblem vektor bawaan)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 bg-stone-50"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Kosongkan kolom ini jika ingin memakai lambang resmi standar Bawaslu Kota Batam.
                  </p>
                </div>

                {/* Preview */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-4">
                  <div className="text-xs font-bold text-slate-500">Pratinjau Logo Saat Ini:</div>
                  {editSettings.logoUrl ? (
                    <img
                      src={editSettings.logoUrl}
                      alt="Preview Logo"
                      className="h-12 w-auto object-contain bg-white p-1 rounded-lg border border-stone-300"
                    />
                  ) : (
                    <div className="px-3 py-1.5 rounded-lg bg-red-800 text-amber-300 font-bold text-xs">
                      Emblem Standar Bawaslu Batam (Aktif)
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Setting */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-red-700" />
                  <span>Banner Utama Halaman Beranda</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Gambar Banner Utama (JPG, JPEG, PNG)
                  </label>
                  <input
                    type="url"
                    value={editSettings.bannerUrl}
                    onChange={(e) => setEditSettings({ ...editSettings, bannerUrl: e.target.value })}
                    placeholder="https://example.com/banner-layanan-bawaslu.jpg (kosongkan untuk latar gradien elegan)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 bg-stone-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Headline Banner
                    </label>
                    <input
                      type="text"
                      value={editSettings.bannerHeadline}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, bannerHeadline: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subline / Keterangan Banner
                    </label>
                    <input
                      type="text"
                      value={editSettings.bannerSubline}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, bannerSubline: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                {/* Preview Banner */}
                {editSettings.bannerUrl && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="text-xs font-bold text-slate-500 mb-2">Pratinjau Banner:</div>
                    <img
                      src={editSettings.bannerUrl}
                      alt="Banner Preview"
                      className="h-32 w-full object-cover rounded-lg border border-stone-300"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition"
                >
                  Simpan Perubahan Logo & Banner
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: PENGATURAN WEBSITE & FOOTER */}
        {/* ========================================================= */}
        {activeTab === 'website_settings' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Pengaturan Umum Website & Footer
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Kelola identitas aplikasi, alamat kantor pada footer, kontak layanan, dan batas pertanyaan pengunjung.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Identitas & Kontak Layanan</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Judul Aplikasi
                    </label>
                    <input
                      type="text"
                      value={editSettings.appName}
                      onChange={(e) => setEditSettings({ ...editSettings, appName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor Hotline / Telepon
                    </label>
                    <input
                      type="text"
                      value={editSettings.contactPhone}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, contactPhone: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Layanan Klinik Hukum
                    </label>
                    <input
                      type="email"
                      value={editSettings.contactEmail}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, contactEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Batas Pertanyaan Pengunjung (Guest Limit)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editSettings.guestQuestionLimit}
                      onChange={(e) =>
                        setEditSettings({
                          ...editSettings,
                          guestQuestionLimit: parseInt(e.target.value, 10) || 3,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                {/* Office Address (Specified requirement: Alamat footer dapat diubah melalui halaman admin) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Kantor pada Footer *
                  </label>
                  <textarea
                    rows={2}
                    value={editSettings.officeAddress}
                    onChange={(e) =>
                      setEditSettings({ ...editSettings, officeAddress: e.target.value })
                    }
                    placeholder="King Busines Centre, Blok C1 No 17 – 19 Belian, Batam Kota."
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Alamat ini otomatis tampil pada bagian bawah (footer) di seluruh halaman pengguna.
                  </p>
                </div>

                {/* Social media links */}
                <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Facebook URL</label>
                    <input
                      type="url"
                      value={editSettings.facebookUrl}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, facebookUrl: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Instagram URL</label>
                    <input
                      type="url"
                      value={editSettings.instagramUrl}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, instagramUrl: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">YouTube URL</label>
                    <input
                      type="url"
                      value={editSettings.youtubeUrl}
                      onChange={(e) =>
                        setEditSettings({ ...editSettings, youtubeUrl: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition"
                >
                  Simpan Pengaturan Website
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: MANAJEMEN PENGGUNA */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Manajemen Pengguna Terdaftar
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Kelola akun masyarakat dan administrator, status keaktifan, dan profil pengguna.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-slate-600 uppercase font-bold">
                    <tr>
                      <th className="py-3.5 px-4">Nama Lengkap</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">No. HP</th>
                      <th className="py-3.5 px-4">Instansi</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">{u.fullName}</td>
                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3 px-4 text-slate-600">{u.phone}</td>
                        <td className="py-3 px-4 text-slate-600">{u.agency || '-'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            disabled={u.id === currentUser.id}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                              u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            } disabled:opacity-50`}
                          >
                            {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {u.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition"
                              title="Hapus Akun Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: MODERASI FORUM & DISKUSI */}
        {/* ========================================================= */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Moderasi Forum & Diskusi Hukum
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Awasi topik diskusi, komentar masyarakat, dan tindak lanjuti laporan konten yang tidak sesuai.
              </p>
            </div>

            {/* Reports Section */}
            {moderationReports.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-200 p-6 space-y-3">
                <h3 className="text-base font-bold text-red-900 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-700" />
                  <span>Laporan Konten Menunggu Tindakan ({moderationReports.filter(r => r.status === 'pending').length})</span>
                </h3>

                <div className="space-y-2">
                  {moderationReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-3 bg-white rounded-xl border border-red-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-red-800 uppercase mr-2">
                          [{rep.targetType}]
                        </span>
                        <span className="text-slate-800">Alasan: "{rep.reason}"</span>
                        <span className="text-slate-400 ml-2">Pelapor: {rep.reportedBy}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {rep.status === 'pending' ? (
                          <button
                            onClick={() => handleResolveReport(rep.id)}
                            className="px-2.5 py-1 rounded bg-emerald-700 text-white font-bold"
                          >
                            Tandai Selesai
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold">Terselesaikan</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Discussions List */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Daftar Seluruh Topik Diskusi</h3>

              <div className="space-y-3">
                {moderationDiscussions.map((disc) => (
                  <div
                    key={disc.id}
                    className="p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          {disc.category}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{disc.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{disc.content}</p>
                      <div className="text-[11px] text-slate-400">
                        Oleh: {disc.authorName} ({disc.authorAgency}) • {disc.commentsCount} Komentar
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggleDiscussionStatus(disc)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          disc.status === 'active'
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                        }`}
                      >
                        {disc.status === 'active' ? 'Sembunyikan' : 'Tampilkan'}
                      </button>
                      <button
                        onClick={() => handleDeleteDiscussion(disc.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition"
                        title="Hapus Diskusi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: PENGATURAN AI & SANDBOX */}
        {/* ========================================================= */}
        {activeTab === 'ai_settings' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Pengaturan AI Awasmin & Sandbox Uji Coba
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Uji langsung akurasi rujukan pasal AI, konfigurasi pesan fallback, dan verifikasi kepatuhan terhadap aturan zero-hallucination.
              </p>
            </div>

            {/* Fallback Message Configuration */}
            <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-red-700" />
                <span>Pesan Baku Ketika Jawaban Tidak Ditemukan dalam Dokumen</span>
              </h3>

              <div>
                <textarea
                  rows={3}
                  value={editSettings.fallbackMessage}
                  onChange={(e) =>
                    setEditSettings({ ...editSettings, fallbackMessage: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 bg-stone-50"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Pesan wajib ini akan dikembalikan secara otomatis oleh AI jika pertanyaan masyarakat berada di luar dokumen peraturan yang dimasukkan admin.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs"
                >
                  Simpan Pesan Baku
                </button>
              </div>
            </form>

            {/* Sandbox Tester */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Uji Coba AI Chatbot (Sandbox Konsol)</span>
              </h3>

              <form onSubmit={handleTestSandbox} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sandboxPrompt}
                    onChange={(e) => setSandboxPrompt(e.target.value)}
                    placeholder="Masukkan pertanyaan hukum untuk menguji Awasmin AI..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 bg-stone-50"
                  />
                  <button
                    type="submit"
                    disabled={sandboxLoading || !sandboxPrompt.trim()}
                    className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Uji AI</span>
                  </button>
                </div>
              </form>

              {sandboxLoading && (
                <div className="p-4 bg-stone-50 rounded-xl text-center text-xs font-semibold text-slate-600 animate-pulse">
                  Sedang menelusuri database dokumen dan mengevaluasi prompt AI...
                </div>
              )}

              {sandboxResult && (
                <div className="p-5 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <span className="font-bold text-slate-800">Hasil Evaluasi AI:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        sandboxResult.isFound
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {sandboxResult.isFound ? '✓ Rujukan Ditemukan' : '⚠️ Fallback Terpicu'}
                    </span>
                  </div>

                  <div className="whitespace-pre-line text-slate-800 leading-relaxed bg-white p-4 rounded-lg border border-stone-200">
                    {sandboxResult.answer}
                  </div>

                  {sandboxResult.legalBasis?.length > 0 && (
                    <div>
                      <span className="font-bold text-red-800 block mb-1">Dasar Hukum:</span>
                      <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                        {sandboxResult.legalBasis.map((b: string, i: number) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: RIWAYAT CHATBOT */}
        {/* ========================================================= */}
        {activeTab === 'chat_history' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Riwayat Pertanyaan Chatbot AI
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Log pertanyaan masyarakat dan jawaban yang telah diberikan oleh sistem Awasmin AI.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-slate-600 uppercase font-bold">
                    <tr>
                      <th className="py-3.5 px-4">Waktu</th>
                      <th className="py-3.5 px-4">Tipe Pengguna</th>
                      <th className="py-3.5 px-4">Pertanyaan Masyarakat</th>
                      <th className="py-3.5 px-4">Status Hasil</th>
                      <th className="py-3.5 px-4">Rujukan Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {chatLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Belum ada pertanyaan yang tercatat dalam sistem.
                        </td>
                      </tr>
                    ) : (
                      chatLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-stone-50/60">
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.userType === 'guest'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {log.userType === 'guest' ? 'Pengunjung (Guest)' : 'Pengguna Terdaftar'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 max-w-sm">
                            {log.question}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.isFound
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-stone-200 text-stone-600'
                              }`}
                            >
                              {log.isFound ? 'Terjawab Regulasi' : 'Pesan Baku'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {log.references?.join(', ') || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL TAMBAH / EDIT DOKUMEN */}
        {/* ========================================================= */}
        {docModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-red-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-5">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingDocId ? 'Edit Dokumen & Sumber AI' : 'Tambah Dokumen & Sumber AI Baru'}
                </h3>
                <button
                  onClick={() => setDocModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveDocument} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Judul Dokumen *
                  </label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Contoh: Undang-Undang Nomor 7 Tahun 2017 tentang Pemilihan Umum"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. Kategori Dokumen *
                    </label>
                    <select
                      value={docCategory}
                      onChange={(e) => setDocCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 bg-stone-50"
                      required
                    >
                      <option value="UU Pemilu">UU Pemilu</option>
                      <option value="Perbawaslu">Perbawaslu</option>
                      <option value="PKPU">PKPU</option>
                      <option value="Peraturan Terkait">Peraturan Terkait</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      3. Nomor Peraturan *
                    </label>
                    <input
                      type="text"
                      value={docRegNumber}
                      onChange={(e) => setDocRegNumber(e.target.value)}
                      placeholder="Contoh: 7"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      4. Tahun Peraturan *
                    </label>
                    <input
                      type="text"
                      value={docYear}
                      onChange={(e) => setDocYear(e.target.value)}
                      placeholder="Contoh: 2017"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    5. Deskripsi Dokumen
                  </label>
                  <textarea
                    rows={2}
                    value={docDesc}
                    onChange={(e) => setDocDesc(e.target.value)}
                    placeholder="Ringkasan ruang lingkup atau pokok pengaturan..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      6. Link Google Drive Resmi
                    </label>
                    <input
                      type="url"
                      value={docDriveLink}
                      onChange={(e) => setDocDriveLink(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      7. Tanggal Publikasi
                    </label>
                    <input
                      type="date"
                      value={docPublishDate}
                      onChange={(e) => setDocPublishDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    8. Status Dokumen
                  </label>
                  <select
                    value={docStatus}
                    onChange={(e) => setDocStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600 bg-stone-50"
                  >
                    <option value="active">Aktif (Digunakan dalam RAG AI & Perpustakaan)</option>
                    <option value="inactive">Nonaktif (Disembunyikan)</option>
                  </select>
                </div>

                {/* Full Text Content for RAG AI Indexing */}
                <div className="pt-2 border-t border-stone-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Naskah Lengkap / Teks Peraturan (Untuk Chunking & Basis Pengetahuan AI) *
                    </label>
                    <span className="text-[11px] text-amber-700 font-bold">
                      Otomatis Di-chunk per Pasal
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder="Masukkan naskah hukum lengkap (BAB, Pasal, Ayat). Format teks ini akan otomatis dipecah menjadi chunks dan diindeks secara semantik untuk Awasmin AI..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-red-600 bg-stone-50"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDocModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs"
                  >
                    Simpan Dokumen & Indeks AI
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
