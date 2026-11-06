import React from 'react';
import { SiteSettings } from '../types';
import { ShieldCheck, Scale, BookOpen, MessageCircleQuestion, Sparkles } from 'lucide-react';

interface HeroBannerProps {
  settings: SiteSettings;
  onExploreDocuments: () => void;
  onAskClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ settings, onExploreDocuments, onAskClick }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-red-900 via-red-800 to-amber-950 text-white rounded-2xl mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 shadow-xl border border-red-700/50">
      {/* If custom banner image is provided by admin */}
      {settings.bannerUrl ? (
        <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
          <img
            src={settings.bannerUrl}
            alt="Banner Klinik Hukum Bawaslu Kota Batam"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-600/90 text-amber-100 backdrop-blur-xs w-fit mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              Bawaslu Kota Batam Official Legal Service
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              {settings.bannerHeadline || settings.appName}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-stone-200 max-w-2xl drop-shadow">
              {settings.bannerSubline || settings.description}
            </p>
          </div>
        </div>
      ) : (
        /* Default Elegant Institutional Hero Canvas */
        <div className="relative px-6 py-10 sm:px-12 sm:py-14 lg:py-16">
          {/* Subtle Decorative Indonesian Batik / Wave Geometric overlay */}
          <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-red-600/20 blur-3xl pointer-events-none"></div>
          <div className="absolute right-10 bottom-0 opacity-10 pointer-events-none hidden md:block">
            <Scale className="w-80 h-80 text-amber-200" />
          </div>

          <div className="relative z-10 max-w-3xl">
            {/* Institution Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/70 border border-amber-300/30 text-amber-200 text-xs sm:text-sm font-semibold mb-4 backdrop-blur-xs shadow-inner">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Bersama Rakyat Awasi Pemilu, Bersama Bawaslu Tegakkan Keadilan Pemilu</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              {settings.bannerHeadline || 'Layanan Konsultasi Hukum Kepemiluan Cerdas & Terpercaya'}
            </h1>

            <p className="mt-4 text-sm sm:text-base text-amber-100/90 leading-relaxed max-w-2xl">
              {settings.bannerSubline || 'Dapatkan jawaban kepastian hukum pemilu berbasis Artificial Intelligence resmi Bawaslu Kota Batam, jelajahi perpustakaan regulasi, dan berpartisipasi dalam diskusi penegakan hukum kepemiluan.'}
            </p>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onAskClick}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg hover:shadow-amber-500/30 transition transform active:scale-95"
              >
                <Sparkles className="w-4 h-4 fill-current text-slate-950" />
                <span>Tanya Awasmin AI Sekarang</span>
              </button>

              <button
                onClick={onExploreDocuments}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-xs transition"
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>Eksplorasi Dokumen Regulasi</span>
              </button>
            </div>

            {/* Stats Pills */}
            <div className="mt-10 pt-6 border-t border-red-700/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
              <div>
                <div className="text-xl sm:text-2xl font-black text-amber-300">UU Pemilu</div>
                <div className="text-xs text-stone-300">Regulasi Induk RI</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-amber-300">Perbawaslu</div>
                <div className="text-xs text-stone-300">Standar Pengawasan</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-amber-300">PKPU</div>
                <div className="text-xs text-stone-300">Teknis Tahapan Pemilu</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-amber-300">AI RAG</div>
                <div className="text-xs text-stone-300">Rujukan Dokumen Resmi</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
