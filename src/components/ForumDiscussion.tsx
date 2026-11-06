import React, { useState, useEffect } from 'react';
import { User, Discussion, DiscussionComment } from '../types';
import { api } from '../services/api';
import { 
  MessageSquare, 
  PlusCircle, 
  Search, 
  Filter, 
  ArrowLeft, 
  Send, 
  Flag, 
  ShieldCheck, 
  User as UserIcon, 
  Clock, 
  X, 
  AlertTriangle,
  Lock,
  CheckCircle2,
  Share2
} from 'lucide-react';

interface ForumDiscussionProps {
  user: User | null;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const ForumDiscussion: React.FC<ForumDiscussionProps> = ({
  user,
  onOpenLogin,
  onOpenRegister,
}) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<(Discussion & { comments: DiscussionComment[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState<{ type: 'discussion' | 'comment'; id: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // New discussion form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Penanganan Pelanggaran');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New comment
  const [commentText, setCommentText] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  const categories = [
    'Semua',
    'Penanganan Pelanggaran',
    'Sengketa Pemilu',
    'Tahapan Kampanye',
    'Netralitas ASN',
    'Partisipasi Masyarakat',
  ];

  useEffect(() => {
    fetchDiscussions();
  }, [searchTerm, selectedCategory]);

  const fetchDiscussions = async () => {
    setIsLoading(true);
    try {
      const response = await api.getDiscussions({
        category: selectedCategory !== 'Semua' ? selectedCategory : undefined,
        search: searchTerm || undefined,
      });
      setDiscussions(response.data);
    } catch (err) {
      console.error('Error fetching discussions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDiscussion = async (id: string) => {
    setIsDetailLoading(true);
    try {
      const res = await api.getDiscussion(id);
      setSelectedDiscussion(res.data);
    } catch (err) {
      console.error('Error opening discussion:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCreateDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createDiscussion({
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      fetchDiscussions();
    } catch (err: any) {
      alert(err.message || 'Gagal menerbitkan diskusi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedDiscussion) return;

    setIsCommentSubmitting(true);
    try {
      const res = await api.createComment(selectedDiscussion.id, commentText.trim());
      setCommentText('');
      // Reload discussion detail
      const updated = await api.getDiscussion(selectedDiscussion.id);
      setSelectedDiscussion(updated.data);
      // Also update list count
      fetchDiscussions();
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim komentar');
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReportModal || !reportReason.trim()) return;

    try {
      await api.reportContent({
        targetType: showReportModal.type,
        targetId: showReportModal.id,
        reason: reportReason.trim(),
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setShowReportModal(null);
        setReportReason('');
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim laporan');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* If Detail Discussion View is Active */}
      {selectedDiscussion ? (
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => setSelectedDiscussion(null)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-800 mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Forum Diskusi</span>
          </button>

          {/* Main Discussion Post Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 sm:p-8 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="px-3 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800">
                {selectedDiscussion.category}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(selectedDiscussion.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {selectedDiscussion.title}
            </h1>

            {/* Author info */}
            <div className="mt-4 flex items-center justify-between border-y border-stone-100 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                  {selectedDiscussion.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{selectedDiscussion.authorName}</div>
                  <div className="text-xs text-slate-500">{selectedDiscussion.authorAgency || 'Masyarakat'}</div>
                </div>
              </div>

              {user && (
                <button
                  onClick={() => setShowReportModal({ type: 'discussion', id: selectedDiscussion.id })}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-600 transition"
                  title="Laporkan konten tidak pantas"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Laporkan</span>
                </button>
              )}
            </div>

            {/* Body text */}
            <div className="mt-6 text-sm sm:text-base text-slate-700 whitespace-pre-line leading-relaxed">
              {selectedDiscussion.content}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-700" />
                <span>Tanggapan & Diskusi ({selectedDiscussion.comments?.length || 0})</span>
              </h2>
            </div>

            {/* Post a Comment Form */}
            {user ? (
              <form onSubmit={handleCreateComment} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tulis Tanggapan Anda:
                </label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Berikan analisis hukum, pandangan, atau klarifikasi Anda secara santun..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                  required
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isCommentSubmitting || !commentText.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs sm:text-sm shadow-xs transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim Tanggapan</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-stone-100 p-6 rounded-2xl text-center border border-stone-200">
                <Lock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">
                  Ingin ikut berdiskusi atau memberikan tanggapan hukum?
                </p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Pengunjung hanya dapat membaca diskusi. Silakan masuk atau daftar akun untuk berpartisipasi.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={onOpenLogin}
                    className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={onOpenRegister}
                    className="px-4 py-2 rounded-xl bg-white border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition"
                  >
                    Daftar Akun
                  </button>
                </div>
              </div>
            )}

            {/* Comments List */}
            {selectedDiscussion.comments && selectedDiscussion.comments.length > 0 ? (
              <div className="space-y-4">
                {selectedDiscussion.comments.map((comm) => {
                  const isAdmin = comm.authorRole === 'admin';
                  return (
                    <div
                      key={comm.id}
                      className={`p-5 rounded-2xl border transition ${
                        isAdmin
                          ? 'bg-red-50/80 border-red-200 shadow-xs'
                          : 'bg-white border-stone-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              isAdmin ? 'bg-amber-700' : 'bg-slate-700'
                            }`}
                          >
                            {comm.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                              <span>{comm.authorName}</span>
                              {isAdmin && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-700 text-white">
                                  <ShieldCheck className="w-3 h-3" />
                                  Resmi Bawaslu
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {comm.authorAgency || 'Masyarakat'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            {new Date(comm.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {user && (
                            <button
                              onClick={() => setShowReportModal({ type: 'comment', id: comm.id })}
                              className="text-slate-400 hover:text-red-600 transition"
                              title="Laporkan"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed pl-10">
                        {comm.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-stone-200 text-slate-400 text-xs sm:text-sm">
                Belum ada tanggapan pada topik ini. Jadilah yang pertama memberikan masukan hukum!
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Discussion Topics Overview List */
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 uppercase tracking-wider mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Ruang Diskusi & Konsultasi Publik
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Forum Diskusi Hukum Pemilu
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Wadah interaktif masyarakat Kota Batam untuk berdiskusi, bertanya, dan mengkaji penerapan regulasi pemilu secara terbuka.
              </p>
            </div>

            <div>
              {user ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Topik Diskusi</span>
                </button>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Masuk untuk Buat Topik</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Category Pills */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs mb-8 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari topik diskusi atau nama pembuat..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Kategori:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-red-700 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Topics List */}
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold text-slate-600">Memuat topik diskusi...</p>
            </div>
          ) : discussions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 max-w-lg mx-auto">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">Belum ada topik diskusi</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Jadilah yang pertama membuka pertanyaan atau diskusi kepemiluan di Bawaslu Kota Batam.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {discussions.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-red-100 text-red-800">
                        {item.category}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h2
                      onClick={() => handleOpenDiscussion(item.id)}
                      className="text-base sm:text-lg font-bold text-slate-900 leading-snug hover:text-red-700 cursor-pointer transition"
                    >
                      {item.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>

                    <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{item.authorName}</span>
                      <span>•</span>
                      <span>{item.authorAgency || 'Masyarakat Umum'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 px-3 py-1.5 rounded-lg bg-stone-100">
                      <MessageSquare className="w-4 h-4 text-red-700" />
                      <span>{item.commentsCount} Komentar</span>
                    </div>

                    <button
                      onClick={() => handleOpenDiscussion(item.id)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-bold shadow-xs transition"
                    >
                      <span>Lihat Diskusi</span>
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Buat Topik Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Buat Topik Diskusi Baru</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscussion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Pembahasan *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                  required
                >
                  {categories.filter((c) => c !== 'Semua').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Pertanyaan / Diskusi *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Misal: Batasan Pemasangan Baliho Dekat Sekolah di Batam"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uraian Pertanyaan / Isu Hukum *
                </label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Jelaskan kronologi, latar belakang, atau pasal yang ingin dikonsultasikan..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menerbitkan...' : 'Terbitkan Topik'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Laporkan Konten */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2 text-red-700 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <span>Laporkan Konten</span>
              </div>
              <button
                onClick={() => setShowReportModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-800">Laporan Terkirim</h4>
                <p className="text-xs text-slate-600">
                  Terima kasih atas kepedulian Anda. Tim Administrator Bawaslu akan menindaklanjuti konten ini.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReport} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Bantu kami menjaga forum konsultasi hukum tetap kondusif, beretika, dan sesuai peraturan perundang-undangan.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alasan Pelaporan *
                  </label>
                  <textarea
                    rows={3}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Jelaskan alasan (misal: ujaran kebencian, hoax, promosi ilegal, politik uang)..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(null)}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs"
                  >
                    Kirim Laporan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
