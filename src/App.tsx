/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ChatbotSection } from './components/ChatbotSection';
import { DocumentLibrary } from './components/DocumentLibrary';
import { RecentRegulations } from './components/RecentRegulations';
import { ForumDiscussion } from './components/ForumDiscussion';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModals } from './components/AuthModals';
import { Footer } from './components/Footer';
import { User, SiteSettings, ChatQuota } from './types';
import { api, removeAuthToken } from './services/api';
import { ShieldCheck, Scale, AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'documents' | 'recent' | 'forum' | 'admin'>('home');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | undefined>(undefined);

  // Core App State
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SiteSettings>({
    appName: 'Klinik Hukum Bawaslu Kota Batam',
    tagline: 'Layanan Konsultasi Hukum Kepemiluan Berbasis AI, Regulasi Resmi, & Forum Diskusi',
    description: 'Portal resmi konsultasi hukum kepemiluan Bawaslu Kota Batam. Akses regulasi pemilu terpercaya, tanyakan aturan hukum pada asisten cerdas Awasmin, dan berdiskusi demi tegaknya keadilan pemilu di Kota Batam.',
    logoUrl: '',
    bannerUrl: '',
    bannerHeadline: 'Konsultasi Hukum Kepemiluan Cerdas, Cepat, dan Akurat',
    bannerSubline: 'Tanyakan regulasi kepemiluan kepada Asisten Cerdas Awasmin yang merujuk langsung pada sumber hukum resmi Bawaslu Kota Batam.',
    officeAddress: 'King Busines Centre, Blok C1 No 17 – 19 Belian, Batam Kota.',
    contactPhone: '+62 778 480 3456',
    contactEmail: 'klinikhukum@batam.bawaslu.go.id',
    facebookUrl: 'https://facebook.com/bawaslubatam',
    instagramUrl: 'https://instagram.com/bawaslukotabatam',
    youtubeUrl: 'https://youtube.com/@bawaslukotabatam',
    fallbackMessage: 'Maaf, informasi yang Anda tanyakan belum tersedia dalam basis data referensi Klinik Hukum Bawaslu Kota Batam. Silakan menghubungi layanan Klinik Hukum untuk mendapatkan informasi lebih lanjut.',
    guestQuestionLimit: 3,
  });

  const [quota, setQuota] = useState<ChatQuota>({
    isGuest: true,
    isUnlimited: false,
    remaining: 3,
    limit: 3,
  });

  // Modal controls
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Load initial settings, session, and quota
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // 1. Fetch site settings
      const settingsRes = await api.getSettings();
      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }

    try {
      // 2. Fetch current logged-in user
      const meRes = await api.getMe();
      if (meRes.user) {
        setUser(meRes.user);
      }
    } catch (e) {
      console.error('Error fetching session:', e);
    }

    try {
      // 3. Fetch chat quota
      const quotaRes = await api.getChatQuota();
      setQuota(quotaRes);
    } catch (e) {
      console.error('Error fetching quota:', e);
    }
  };

  const handleNavigate = (view: string, subCategory?: string) => {
    if (view === 'admin') {
      if (!user || user.role !== 'admin') {
        alert('Akses khusus administrator. Silakan masuk dengan akun admin (contoh: admin@bawaslu.go.id / adminbawaslu123).');
        setLoginModalOpen(true);
        return;
      }
    }

    setSelectedSubCategory(subCategory);
    setCurrentView(view as any);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    setCurrentView('home');
    // Refresh quota as guest
    api.getChatQuota().then(setQuota).catch(() => {});
  };

  const handleUserChanged = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      setQuota({
        isGuest: false,
        isUnlimited: true,
        remaining: 9999,
        limit: 9999,
      });
    } else {
      api.getChatQuota().then(setQuota).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-slate-800 font-sans selection:bg-red-700 selection:text-white">
      {/* If in Admin view, render full admin view */}
      {currentView === 'admin' && user?.role === 'admin' ? (
        <AdminDashboard
          currentUser={user}
          settings={settings}
          onSettingsUpdated={(newSettings) => setSettings(newSettings)}
          onExitAdmin={() => handleNavigate('home')}
        />
      ) : (
        <>
          {/* Header & Navbar */}
          <Navbar
            currentView={currentView}
            onNavigate={handleNavigate}
            user={user}
            settings={settings}
            onOpenLogin={() => setLoginModalOpen(true)}
            onOpenRegister={() => setRegisterModalOpen(true)}
            onOpenProfile={() => setProfileModalOpen(true)}
            onLogout={handleLogout}
          />

          {/* Main Content Router */}
          <div className="flex-1">
            {currentView === 'home' && (
              <div>
                {/* Hero Banner */}
                <HeroBanner
                  settings={settings}
                  onExploreDocuments={() => handleNavigate('documents')}
                  onAskClick={() => {
                    const el = document.getElementById('tanya-awasmin');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />

                {/* Chatbot AI Section: Tanya Awasmin... */}
                <ChatbotSection
                  user={user}
                  settings={settings}
                  onOpenLogin={() => setLoginModalOpen(true)}
                  onOpenRegister={() => setRegisterModalOpen(true)}
                  quota={quota}
                  onQuotaUpdated={(q) => setQuota(q)}
                />

                {/* Quick Regulation Preview Section on Home */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-950 rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-red-800">
                    <div className="space-y-2 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-amber-300/30 text-amber-300 text-xs font-semibold">
                        <Scale className="w-3.5 h-3.5" />
                        <span>Koleksi 4 Kategori Regulasi Utama</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                        Perpustakaan Hukum Kepemiluan Kota Batam
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
                        Akses naskah resmi Undang-Undang Pemilu, Perbawaslu, PKPU, dan Surat Keputusan Bersama Netralitas ASN langsung dalam format teks lengkap maupun berkas Google Drive.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => handleNavigate('documents')}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-md"
                      >
                        Buka Semua Dokumen
                      </button>
                      <button
                        onClick={() => handleNavigate('forum')}
                        className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition"
                      >
                        Ruang Diskusi Publik
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'documents' && (
              <DocumentLibrary
                initialCategory={selectedSubCategory}
                onClearInitialCategory={() => setSelectedSubCategory(undefined)}
              />
            )}

            {currentView === 'recent' && <RecentRegulations />}

            {currentView === 'forum' && (
              <ForumDiscussion
                user={user}
                onOpenLogin={() => setLoginModalOpen(true)}
                onOpenRegister={() => setRegisterModalOpen(true)}
              />
            )}
          </div>

          {/* Institutional Footer */}
          <Footer settings={settings} onNavigate={handleNavigate} />

          {/* Authentication & Profile Modals */}
          <AuthModals
            loginOpen={loginModalOpen}
            registerOpen={registerModalOpen}
            profileOpen={profileModalOpen}
            user={user}
            onCloseLogin={() => setLoginModalOpen(false)}
            onCloseRegister={() => setRegisterModalOpen(false)}
            onCloseProfile={() => setProfileModalOpen(false)}
            onOpenLogin={() => setLoginModalOpen(true)}
            onOpenRegister={() => setRegisterModalOpen(true)}
            onUserChanged={handleUserChanged}
          />
        </>
      )}
    </div>
  );
}
