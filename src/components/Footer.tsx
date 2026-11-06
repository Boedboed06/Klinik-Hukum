import React from 'react';
import { SiteSettings } from '../types';
import { BawasluLogo } from './BawasluLogo';
import { MapPin, Phone, Mail, ShieldCheck, Scale, ExternalLink, Heart } from 'lucide-react';

interface FooterProps {
  settings: SiteSettings;
  onNavigate: (view: string, subCategory?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t-4 border-red-700 mt-16">
      {/* Upper Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Col 1: Institutional Brand & Motto */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BawasluLogo customUrl={settings.logoUrl} size="md" />
              <div>
                <h3 className="text-base font-extrabold text-white tracking-wide">
                  BAWASLU KOTA BATAM
                </h3>
                <p className="text-xs text-red-400 font-semibold">
                  Klinik Hukum Kepemiluan
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed">
              Layanan resmi konsultasi hukum kepemiluan berbasis Artificial Intelligence dan keterbukaan informasi publik Badan Pengawas Pemilihan Umum Kota Batam.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-amber-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span>Bersama Rakyat Awasi Pemilu</span>
            </div>
          </div>

          {/* Col 2: Alamat Kantor (Configurable via Admin) */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Alamat Kantor</span>
            </h4>

            <div className="p-3.5 rounded-xl bg-stone-800/80 border border-stone-700/60 text-xs leading-relaxed space-y-1">
              <div className="font-extrabold text-white">BAWASLU KOTA BATAM</div>
              <div className="text-amber-200">
                {settings.officeAddress || 'King Busines Centre, Blok C1 No 17 – 19 Belian, Batam Kota.'}
              </div>
            </div>

            <div className="text-xs space-y-1.5 pt-1">
              <div className="flex items-center gap-2 text-stone-300">
                <Phone className="w-3.5 h-3.5 text-red-400" />
                <span>{settings.contactPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-300">
                <Mail className="w-3.5 h-3.5 text-red-400" />
                <span>{settings.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Col 3: Kategori Regulasi */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-red-500" />
              <span>Regulasi Pemilu</span>
            </h4>

            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('documents', 'UU Pemilu')}
                  className="hover:text-red-400 transition"
                >
                  • Undang-Undang Pemilihan Umum
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('documents', 'Perbawaslu')}
                  className="hover:text-red-400 transition"
                >
                  • Peraturan Bawaslu (Perbawaslu)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('documents', 'PKPU')}
                  className="hover:text-red-400 transition"
                >
                  • Peraturan KPU (PKPU)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('documents', 'Peraturan Terkait')}
                  className="hover:text-red-400 transition"
                >
                  • Netralitas ASN & Putusan MK
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('recent')}
                  className="hover:text-red-400 transition"
                >
                  • Peraturan Pemilu Terbaru
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Layanan & Tautan Publik */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Layanan Interaktif
            </h4>

            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-red-400 transition"
                >
                  • Tanya Awasmin (Konsultasi AI)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('forum')}
                  className="hover:text-red-400 transition"
                >
                  • Forum Diskusi Hukum Kepemiluan
                </button>
              </li>
              <li>
                <a
                  href="https://batam.bawaslu.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-red-400 transition"
                >
                  <span>• Portal Resmi Bawaslu Kota Batam</span>
                  <ExternalLink className="w-3 h-3 text-stone-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://bawaslu.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-red-400 transition"
                >
                  <span>• Bawaslu Republik Indonesia</span>
                  <ExternalLink className="w-3 h-3 text-stone-500" />
                </a>
              </li>
            </ul>

            {/* Social Media Links */}
            <div className="pt-2 flex items-center gap-3">
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-stone-800 hover:bg-red-800 text-stone-300 hover:text-white text-xs font-bold transition"
                >
                  Facebook
                </a>
              )}
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-stone-800 hover:bg-red-800 text-stone-300 hover:text-white text-xs font-bold transition"
                >
                  Instagram
                </a>
              )}
              {settings.youtubeUrl && (
                <a
                  href={settings.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-stone-800 hover:bg-red-800 text-stone-300 hover:text-white text-xs font-bold transition"
                >
                  YouTube
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-stone-950 py-5 border-t border-stone-800/80 text-center text-xs text-stone-500 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © {new Date().getFullYear()} <span className="text-stone-300 font-bold">Klinik Hukum Bawaslu Kota Batam</span>. Hak Cipta Dilindungi Undang-Undang.
          </div>
          <div className="text-[11px] text-stone-400">
            Sistem Konsultasi Hukum Kepemiluan Berbasis RAG Artificial Intelligence
          </div>
        </div>
      </div>
    </footer>
  );
};
