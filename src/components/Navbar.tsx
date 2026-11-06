import React, { useState } from 'react';
import { BawasluLogo } from './BawasluLogo';
import { User, SiteSettings } from '../types';
import { 
  Menu, 
  X, 
  UserPlus, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  ShieldAlert, 
  FileText, 
  MessageSquare, 
  Clock, 
  Home,
  Scale
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, subCategory?: string) => void;
  user: User | null;
  settings: SiteSettings;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  user,
  settings,
  onOpenLogin,
  onOpenRegister,
  onOpenProfile,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'documents', label: 'Semua Dokumen', icon: FileText },
    { id: 'recent', label: 'Peraturan Terbaru', icon: Clock },
    { id: 'forum', label: 'Diskusi', icon: MessageSquare },
  ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-red-100 shadow-sm">
      {/* Top Banner Ribbon */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-amber-900 text-amber-100 text-xs py-1 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center font-medium">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Portal Resmi Layanan Konsultasi Hukum Kepemiluan • Bawaslu Kota Batam</span>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-amber-200/90 text-[11px]">
            <span>Hotline: {settings.contactPhone}</span>
            <span>•</span>
            <span>Koleksi Regulasi Pemilu Terlengkap</span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Title */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3.5 cursor-pointer group py-2"
          >
            <BawasluLogo customUrl={settings.logoUrl} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-red-700 transition">
                  KLINIK HUKUM
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 uppercase tracking-wider">
                  AI-Ready
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-red-700 tracking-wide">
                BAWASLU KOTA BATAM
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 font-medium text-sm">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-red-50 text-red-700 font-bold shadow-xs'
                      : 'text-slate-700 hover:text-red-700 hover:bg-stone-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-red-700' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}

            {/* Admin Dashboard shortcut if admin */}
            {user && user.role === 'admin' && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 ml-2 rounded-lg text-xs font-bold transition-all ${
                  currentView === 'admin'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Panel Admin
              </button>
            )}
          </nav>

          {/* Auth Controls (Desktop) */}
          <div className="hidden lg:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs sm:text-sm font-semibold transition"
                  title="Buka Profil"
                >
                  <div className="w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[130px] truncate">{user.fullName}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition"
                  title="Keluar"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenRegister}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-red-700 border border-red-300 hover:bg-red-50 hover:border-red-400 transition shadow-2xs"
                >
                  <UserPlus className="w-4 h-4" />
                  Daftar Akun
                </button>
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-700 hover:bg-red-800 active:bg-red-900 shadow-sm transition"
                >
                  <LogIn className="w-4 h-4" />
                  Masuk
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <button
                onClick={onOpenProfile}
                className="w-8 h-8 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-bold shadow-xs"
              >
                {user.fullName.charAt(0).toUpperCase()}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-stone-100 transition"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <div className="flex flex-col space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-red-50 text-red-700 font-bold'
                      : 'text-slate-700 hover:bg-stone-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-red-700' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}

            {user?.role === 'admin' && (
              <button
                onClick={() => handleNavClick('admin')}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold bg-amber-100 text-amber-900"
              >
                <ShieldAlert className="w-5 h-5 text-amber-700" />
                Halaman Administrator
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onOpenProfile();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold bg-stone-100 text-slate-800"
                >
                  <UserIcon className="w-4 h-4 text-slate-600" />
                  Profil: {user.fullName}
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar dari Akun
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenRegister();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-700 border border-red-300 bg-white"
                >
                  <UserPlus className="w-4 h-4" />
                  Daftar Akun
                </button>
                <button
                  onClick={() => {
                    onOpenLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-bold text-white bg-red-700"
                >
                  <LogIn className="w-4 h-4" />
                  Masuk
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
