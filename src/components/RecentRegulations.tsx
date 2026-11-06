import React, { useState, useEffect } from 'react';
import { LegalDocument } from '../types';
import { api } from '../services/api';
import { Clock, Calendar, ExternalLink, Eye, Search, BookOpen, X, Sparkles } from 'lucide-react';

export const RecentRegulations: React.FC = () => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);

  useEffect(() => {
    fetchRecentDocs();
  }, []);

  const fetchRecentDocs = async () => {
    setIsLoading(true);
    try {
      const response = await api.getRecentDocuments();
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching recent documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      doc.regulationNumber.toLowerCase().includes(q) ||
      doc.year.includes(q) ||
      doc.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider mb-2">
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          Kompilasi Regulasi Terkini
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Peraturan Pemilu Terbaru
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Daftar seluruh peraturan perundang-undangan, Perbawaslu, PKPU, dan edaran terkait pemilu yang baru saja ditambahkan dan diverifikasi oleh Bawaslu Kota Batam.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari regulasi terbaru berdasarkan judul atau nomor..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-white shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-slate-600">Memuat peraturan terbaru...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 max-w-lg mx-auto">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Tidak ada dokumen</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Belum ada peraturan terbaru yang cocok dengan pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDocs.map((doc, index) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-red-100 text-red-800">
                      {doc.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      No. {doc.regulationNumber} / {doc.year}
                    </span>
                  </div>
                  {index === 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      Paling Baru
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug hover:text-red-700 transition">
                  {doc.title}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {doc.description || 'Deskripsi singkat dokumen regulasi resmi Klinik Hukum Bawaslu Kota Batam.'}
                </p>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Diunggah: {doc.publishDate || doc.createdAt.split('T')[0]}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center gap-2">
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-bold shadow-xs transition"
                >
                  <Eye className="w-4 h-4" />
                  <span>Baca Selengkapnya</span>
                </button>

                {doc.googleDriveLink && (
                  <a
                    href={doc.googleDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 transition"
                    title="Buka Dokumen di Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reader Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-red-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-gradient-to-r from-red-800 to-red-700 px-6 py-4 text-white flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-amber-400 text-slate-950 uppercase">
                  {selectedDoc.category} • No. {selectedDoc.regulationNumber} Tahun {selectedDoc.year}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
                  {selectedDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-stone-50 space-y-4">
              <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 mb-2 pb-2 border-b border-stone-100 flex justify-between">
                  <span>Tanggal Publikasi: {selectedDoc.publishDate}</span>
                  <span>{selectedDoc.chunks?.length || 0} Bagian Terindeks AI</span>
                </div>
                <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  {selectedDoc.content || 'Isi naskah dokumen belum diunggah secara lengkap.'}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">
                Klinik Hukum Bawaslu Kota Batam • Terintegrasi Otomatis
              </span>
              <div className="flex items-center gap-2">
                {selectedDoc.googleDriveLink && (
                  <a
                    href={selectedDoc.googleDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Berkas Asli
                  </a>
                )}
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-slate-800 font-semibold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
