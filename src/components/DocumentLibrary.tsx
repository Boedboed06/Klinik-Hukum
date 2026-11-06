import React, { useState, useEffect } from 'react';
import { LegalDocument, DocumentCategory } from '../types';
import { api } from '../services/api';
import { 
  FileText, 
  Scale, 
  BookOpen, 
  Bookmark, 
  Search, 
  ArrowLeft, 
  ExternalLink, 
  Eye, 
  Calendar, 
  Tag, 
  SlidersHorizontal,
  X,
  FileCheck2,
  FolderOpen
} from 'lucide-react';

interface DocumentLibraryProps {
  initialCategory?: string;
  onClearInitialCategory?: () => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ 
  initialCategory,
  onClearInitialCategory
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(
    (initialCategory as DocumentCategory) || null
  );
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Document Reading Modal State
  const [readingDoc, setReadingDoc] = useState<LegalDocument | null>(null);

  const categories: {
    id: DocumentCategory;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      id: 'UU Pemilu',
      name: 'UU PEMILU',
      description: 'Kumpulan Undang-Undang Republik Indonesia yang menjadi landasan hukum utama penyelenggaraan Pemilu & Pilkada serentak.',
      icon: Scale,
      accentColor: 'from-red-700 to-red-900',
    },
    {
      id: 'Perbawaslu',
      name: 'PERBAWASLU',
      description: 'Peraturan Badan Pengawas Pemilihan Umum terkait tata kerja pengawasan, penanganan pelanggaran, dan penyelesaian sengketa proses.',
      icon: Bookmark,
      accentColor: 'from-amber-700 to-amber-900',
    },
    {
      id: 'PKPU',
      name: 'PKPU',
      description: 'Peraturan Komisi Pemilihan Umum yang mengatur teknis pelaksanaan tahapan pemilu, pencalonan, logistik, kampanye, dan pemungutan suara.',
      icon: FileText,
      accentColor: 'from-red-800 to-stone-900',
    },
    {
      id: 'Peraturan Terkait',
      name: 'PERATURAN TERKAIT PEMILU',
      description: 'Surat Keputusan Bersama (SKB), Putusan Mahkamah Konstitusi (MK), regulasi netralitas ASN/TNI/POLRI, serta pedoman hukum pendukung.',
      icon: BookOpen,
      accentColor: 'from-stone-700 to-slate-900',
    },
  ];

  // Fetch documents when category or search changes
  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory, searchTerm, sortOrder]);

  // Synchronize initialCategory prop
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory as DocumentCategory);
    }
  }, [initialCategory]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await api.getDocuments({
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
        sort: sortOrder,
      });
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocCountForCategory = (cat: DocumentCategory) => {
    return documents.filter((d) => d.category === cat).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Category Overview View */}
      {!selectedCategory ? (
        <div>
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 uppercase tracking-wider mb-2">
              <FolderOpen className="w-3.5 h-3.5" />
              Perpustakaan Regulasi Kepemiluan
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Semua Dokumen Hukum
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Pilih kategori regulasi resmi Bawaslu Kota Batam di bawah ini untuk melihat kumpulan dokumen, membaca isi pasal, atau mengakses berkas Google Drive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="group bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.accentColor} text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition`}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-slate-700 border border-stone-200">
                        {getDocCountForCategory(cat.id)} Dokumen Terdaftar
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-red-700 transition">
                      {cat.name}
                    </h2>
                    <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="px-6 sm:px-8 py-4 bg-stone-50 border-t border-stone-100">
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-xs transition"
                    >
                      <span>Buka Dokumen {cat.name}</span>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Specific Category Document View */
        <div>
          {/* Back Header & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 mb-8">
            <div>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  if (onClearInitialCategory) onClearInitialCategory();
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:text-red-800 mb-2 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Semua Kategori</span>
              </button>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Kategori: {selectedCategory}
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Menampilkan daftar dokumen regulasi resmi {selectedCategory} yang terindeks dalam basis pengetahuan hukum Bawaslu Kota Batam.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-red-50 text-red-800 font-bold text-xs sm:text-sm border border-red-200">
                Total: {documents.length} Dokumen
              </span>
            </div>
          </div>

          {/* Search & Sort Filters */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Cari nomor, tahun, atau kata kunci di ${selectedCategory}...`}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
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

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Urutkan:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="newest">Dokumen Terbaru</option>
                <option value="oldest">Dokumen Terlama</option>
              </select>
            </div>
          </div>

          {/* Document Cards List */}
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-4 border-red-700 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-semibold text-slate-600">Memuat koleksi dokumen regulasi...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 max-w-lg mx-auto">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">Tidak ada dokumen ditemukan</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {searchTerm
                  ? `Tidak ada dokumen yang cocok dengan kata kunci "${searchTerm}".`
                  : 'Belum ada dokumen yang dimasukkan untuk kategori ini.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-sm hover:shadow-md transition p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-red-100 text-red-800">
                        {doc.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        No. {doc.regulationNumber} / {doc.year}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Calendar className="w-3 h-3" />
                        {doc.publishDate || doc.createdAt.split('T')[0]}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug hover:text-red-700 transition">
                      {doc.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {doc.description || 'Deskripsi dokumen resmi Klinik Hukum Bawaslu Kota Batam.'}
                    </p>
                  </div>

                  {/* Actions: Baca Dokumen & Buka File */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => setReadingDoc(doc)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs sm:text-sm font-bold transition"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                      <span>Baca Dokumen</span>
                    </button>

                    {doc.googleDriveLink ? (
                      <a
                        href={doc.googleDriveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-bold shadow-xs transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Buka File Drive</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => setReadingDoc(doc)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-bold shadow-xs transition"
                      >
                        <FileCheck2 className="w-4 h-4" />
                        <span>Lihat Naskah</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* In-App Legal Reader Modal */}
      {readingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-red-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-800 to-red-700 px-6 py-4 text-white flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-amber-400 text-slate-950 uppercase">
                  {readingDoc.category} • No. {readingDoc.regulationNumber} Tahun {readingDoc.year}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
                  {readingDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setReadingDoc(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Legal Text Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-stone-50 space-y-4">
              <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
                <div className="text-xs font-semibold text-slate-500 mb-2 pb-2 border-b border-stone-100 flex justify-between">
                  <span>Tanggal Publikasi: {readingDoc.publishDate}</span>
                  <span>{readingDoc.chunks?.length || 0} Bagian Pasal Terindeks RAG AI</span>
                </div>
                <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  {readingDoc.content || 'Isi naskah dokumen belum diunggah secara lengkap oleh admin.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">
                Koleksi Resmi JDIH Klinik Hukum Bawaslu Kota Batam
              </span>
              <div className="flex items-center gap-2">
                {readingDoc.googleDriveLink && (
                  <a
                    href={readingDoc.googleDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Berkas Google Drive Asli
                  </a>
                )}
                <button
                  onClick={() => setReadingDoc(null)}
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
