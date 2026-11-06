import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ChatQuota, SiteSettings } from '../types';
import { api } from '../services/api';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User as UserIcon, 
  AlertCircle, 
  ExternalLink, 
  BookOpen, 
  FileCheck, 
  Scale, 
  ShieldCheck, 
  RotateCcw,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface ChatbotSectionProps {
  user: User | null;
  settings: SiteSettings;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  quota: ChatQuota;
  onQuotaUpdated: (quota: ChatQuota) => void;
}

export const ChatbotSection: React.FC<ChatbotSectionProps> = ({
  user,
  settings,
  onOpenLogin,
  onOpenRegister,
  quota,
  onQuotaUpdated,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'awasmin',
      text: `Halo! Saya **Awasmin**, Asisten Cerdas Hukum Kepemiluan resmi dari **Bawaslu Kota Batam**.\n\nSilakan ajukan pertanyaan seputar Undang-Undang Pemilu, Peraturan Bawaslu (Perbawaslu), Peraturan KPU (PKPU), netralitas ASN, penanganan pelanggaran, sengketa proses, maupun regulasi pemilu lainnya.\n\n*Catatan: Seluruh jawaban saya dirujuk secara ketat dan eksklusif dari dokumen hukum resmi yang telah diverifikasi Bawaslu Kota Batam.*`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    'Apa saja larangan dalam kampanye pemilu menurut UU No. 7 Tahun 2017?',
    'Berapa lama batas waktu masyarakat melapor pelanggaran pemilu?',
    'Apakah ASN boleh berfoto dengan pose jari bersama calon?',
    'Apa sanksi pidana jika melakukan politik uang saat masa tenang?',
    'Di tempat mana saja Alat Peraga Kampanye (APK) dilarang dipasang?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const query = (customPrompt || inputQuery).trim();
    if (!query || isLoading) return;

    // Check if guest has 0 quota remaining
    if (!user && quota.remaining <= 0) {
      setShowLimitModal(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await api.askChatbot(query);
      const resData = response.data;

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'awasmin',
        text: resData.answer,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        legalBasis: resData.legalBasis,
        references: resData.references,
        isFound: resData.isFound,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Update remaining quota
      if (!user) {
        const updatedQuota: ChatQuota = {
          isGuest: true,
          isUnlimited: false,
          remaining: resData.remaining,
          limit: resData.limit,
        };
        onQuotaUpdated(updatedQuota);

        if (resData.remaining <= 0) {
          setShowLimitModal(true);
        }
      }
    } catch (err: any) {
      if (err.code === 'GUEST_LIMIT_REACHED' || err.status === 403) {
        setShowLimitModal(true);
        const limitMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          sender: 'awasmin',
          text: `⚠️ **Batas Pertanyaan Pengunjung Tercapai**\n\nAnda telah menggunakan batas maksimal 3 pertanyaan untuk pengunjung tanpa akun. Silakan mendaftar atau masuk untuk melanjutkan konsultasi hukum kepemiluan tanpa batas kuota.`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, limitMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          sender: 'awasmin',
          text: `Maaf, terjadi gangguan koneksi ke server Klinik Hukum. Silakan coba kembali dalam beberapa saat.`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'awasmin',
        text: `Percakapan baru telah dimulai. Silakan ajukan pertanyaan Anda seputar hukum kepemiluan kepada **Awasmin**.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div id="tanya-awasmin" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Title & Description Card */}
      <div className="bg-white rounded-2xl shadow-md border border-red-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-red-800 to-red-700 px-6 py-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Tanya Awasmin...</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase">
                  AI Verifikasi Dokumen
                </span>
              </div>
              <p className="text-xs sm:text-sm text-red-100 mt-0.5">
                Silakan ajukan pertanyaan seputar hukum kepemiluan dan peraturan perundang-undangan terkait pemilu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-900/60 hover:bg-red-900 text-red-100 border border-red-600/50 transition"
              title="Mulai Percakapan Baru"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Chat
            </button>
          </div>
        </div>

        {/* Quota Banner for Guests vs Registered */}
        <div className="px-6 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          {!user ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Status Akses:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                Pengunjung (Sisa Kesempatan: {quota.remaining} dari {quota.limit} Pertanyaan)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Status Akses:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                Pengguna Terdaftar ({user.fullName}) - Konsultasi Tanpa Batas
              </span>
            </div>
          )}

          {!user && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 hidden md:inline">Perlu bertanya lebih banyak?</span>
              <button
                onClick={onOpenRegister}
                className="font-bold text-red-700 hover:text-red-800 underline underline-offset-2 transition"
              >
                Daftar Akun Gratis Sekarang
              </button>
            </div>
          )}
        </div>

        {/* Chat History Box */}
        <div className="p-4 sm:p-6 bg-stone-50/70 min-h-[420px] max-h-[580px] overflow-y-auto space-y-5">
          {messages.map((msg) => {
            const isAwasmin = msg.sender === 'awasmin';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isAwasmin ? 'justify-start' : 'justify-end'}`}
              >
                {isAwasmin && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-700 to-amber-900 flex-shrink-0 flex items-center justify-center text-amber-200 shadow-sm border border-amber-300/30">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div className={`max-w-[88%] sm:max-w-[80%] ${isAwasmin ? 'space-y-3' : ''}`}>
                  <div
                    className={`rounded-2xl p-4 sm:p-5 shadow-xs text-sm leading-relaxed ${
                      isAwasmin
                        ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm'
                        : 'bg-gradient-to-br from-red-700 to-red-800 text-white rounded-tr-sm shadow-red-700/10'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between mb-2 text-[11px] font-semibold opacity-75">
                      <span>{isAwasmin ? 'Awasmin • Klinik Hukum Bawaslu Batam' : (user?.fullName || 'Pengunjung')}</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Formatted Text Content */}
                    <div className="whitespace-pre-line prose-sm">
                      {msg.text}
                    </div>

                    {/* Legal Basis Badges if present */}
                    {isAwasmin && msg.legalBasis && msg.legalBasis.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-800 mb-2">
                          <Scale className="w-3.5 h-3.5 text-red-700" />
                          <span>Dasar Hukum Terverifikasi:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.legalBasis.map((basis, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-800 border border-red-200"
                            >
                              § {basis}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* References Cards if present */}
                    {isAwasmin && msg.references && msg.references.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                          <span>Dokumen Sumber Referensi:</span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.references.map((ref, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-200 text-xs"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span className="font-semibold text-slate-800 truncate">{ref.title}</span>
                              </div>
                              {ref.link && (
                                <a
                                  href={ref.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-red-700 hover:text-red-900 font-bold ml-2 flex-shrink-0"
                                >
                                  <span>Buka</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {!isAwasmin && (
                  <div className="w-9 h-9 rounded-xl bg-stone-200 text-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-xs">
                    {user ? user.fullName.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 sm:gap-4 items-start">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-700 to-amber-900 flex-shrink-0 flex items-center justify-center text-amber-200 animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm p-4 border border-slate-200 text-slate-600 text-xs sm:text-sm flex items-center gap-3 shadow-xs">
                <div className="flex space-x-1.5">
                  <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce"></span>
                </div>
                <span>Awasmin sedang menelusuri pasal & referensi dokumen resmi Bawaslu Kota Batam...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt Suggestions */}
        <div className="p-4 bg-stone-100/70 border-t border-stone-200">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Pertanyaan Contoh / Populer:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSubmit(undefined, q)}
                disabled={isLoading || (!user && quota.remaining <= 0)}
                className="text-left text-xs bg-white hover:bg-red-50 hover:border-red-300 text-slate-700 hover:text-red-800 px-3 py-1.5 rounded-lg border border-slate-200 transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-stone-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={
                !user && quota.remaining <= 0
                  ? 'Batas pertanyaan pengunjung habis. Silakan daftar atau masuk...'
                  : 'Ketik pertanyaan hukum kepemiluan Anda di sini (misal: "Berapa lama batas melapor sengketa pemilu?")...'
              }
              disabled={isLoading || (!user && quota.remaining <= 0)}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-stone-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition disabled:bg-stone-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim() || (!user && quota.remaining <= 0)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </div>
        </form>
      </div>

      {/* Guest Limit Exceeded Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-4">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              Batas Pertanyaan Pengunjung Tercapai
            </h3>
            
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Anda telah menggunakan <span className="font-bold text-red-700">3 kesempatan bertanya</span> gratis sebagai pengunjung.
              Untuk melanjutkan konsultasi hukum tanpa batas kuota bersama Awasmin AI, silakan mendaftarkan akun atau masuk.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowLimitModal(false);
                  onOpenRegister();
                }}
                className="w-full py-3 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition"
              >
                Daftar Sekarang (Gratis)
              </button>
              <button
                onClick={() => {
                  setShowLimitModal(false);
                  onOpenLogin();
                }}
                className="w-full py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-semibold text-sm transition"
              >
                Sudah Punya Akun? Masuk
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 pt-1"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
