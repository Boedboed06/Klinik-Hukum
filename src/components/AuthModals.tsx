import React, { useState } from 'react';
import { User } from '../types';
import { api, setAuthToken, removeAuthToken } from '../services/api';
import { 
  X, 
  UserPlus, 
  LogIn, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthModalsProps {
  loginOpen: boolean;
  registerOpen: boolean;
  profileOpen: boolean;
  user: User | null;
  onCloseLogin: () => void;
  onCloseRegister: () => void;
  onCloseProfile: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onUserChanged: (user: User | null) => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  loginOpen,
  registerOpen,
  profileOpen,
  user,
  onCloseLogin,
  onCloseRegister,
  onCloseProfile,
  onOpenLogin,
  onOpenRegister,
  onUserChanged,
}) => {
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Register form state (8 mandatory fields)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAgency, setRegAgency] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regBirthYear, setRegBirthYear] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

  // Profile form state
  const [profFullName, setProfFullName] = useState(user?.fullName || '');
  const [profPhone, setProfPhone] = useState(user?.phone || '');
  const [profAgency, setProfAgency] = useState(user?.agency || '');
  const [profBirthDate, setProfBirthDate] = useState(user?.birthDate || '');
  const [profBirthYear, setProfBirthYear] = useState(user?.birthYear || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profError, setProfError] = useState('');
  const [profSuccess, setProfSuccess] = useState('');
  const [isProfLoading, setIsProfLoading] = useState(false);

  // Sync profile state when user updates
  React.useEffect(() => {
    if (user) {
      setProfFullName(user.fullName);
      setProfPhone(user.phone);
      setProfAgency(user.agency);
      setProfBirthDate(user.birthDate || '');
      setProfBirthYear(user.birthYear || '');
    }
  }, [user]);

  // LOGIN HANDLER
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginLoading(true);

    try {
      const res = await api.login(loginIdentifier, loginPassword);
      setAuthToken(res.token);
      onUserChanged(res.user);
      onCloseLogin();
      setLoginIdentifier('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Gagal masuk. Periksa kembali email/nomor HP dan kata sandi Anda.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  // REGISTER HANDLER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword !== regConfirmPassword) {
      setRegError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsRegLoading(true);

    try {
      const res = await api.register({
        fullName: regFullName,
        email: regEmail,
        phone: regPhone,
        agency: regAgency || 'Masyarakat Umum',
        birthDate: regBirthDate,
        birthYear: regBirthYear,
        password: regPassword,
        confirmPassword: regConfirmPassword,
      });

      setAuthToken(res.token);
      onUserChanged(res.user);
      onCloseRegister();

      // Reset form
      setRegFullName('');
      setRegEmail('');
      setRegPhone('');
      setRegAgency('');
      setRegBirthDate('');
      setRegBirthYear('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err: any) {
      setRegError(err.message || 'Pendaftaran gagal. Periksa kembali data Anda.');
    } finally {
      setIsRegLoading(false);
    }
  };

  // PROFILE UPDATE HANDLER
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfError('');
    setProfSuccess('');
    setIsProfLoading(true);

    try {
      const payload: any = {
        fullName: profFullName,
        phone: profPhone,
        agency: profAgency,
        birthDate: profBirthDate,
        birthYear: profBirthYear,
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await api.updateProfile(payload);
      onUserChanged(res.user);
      setProfSuccess('Profil berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setProfError(err.message || 'Gagal memperbarui profil.');
    } finally {
      setIsProfLoading(false);
    }
  };

  return (
    <>
      {/* 1. LOGIN MODAL */}
      {loginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-red-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-5">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                <LogIn className="w-5 h-5 text-red-700" />
                <span>Masuk ke Akun</span>
              </div>
              <button onClick={onCloseLogin} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email atau Nomor HP *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="nama@email.com atau 0812xxxx"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Demo Account Hint */}
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-snug">
                <div className="font-bold mb-0.5">Akun Bawaan Sistem:</div>
                <div>• Admin: <code>admin@bawaslu.go.id</code> / <code>adminbawaslu123</code></div>
                <div>• User: <code>masyarakat@batam.go.id</code> / <code>user123456</code></div>
              </div>

              <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full py-3 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                {isLoginLoading ? 'Memverifikasi...' : 'Masuk Sekarang'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-600">
              Belum memiliki akun?{' '}
              <button
                onClick={() => {
                  onCloseLogin();
                  onOpenRegister();
                }}
                className="font-bold text-red-700 hover:underline"
              >
                Daftar Akun Gratis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REGISTER MODAL (8 Specified Fields) */}
      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-red-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-5">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                <UserPlus className="w-5 h-5 text-red-700" />
                <span>Pendaftaran Akun Klinik Hukum</span>
              </div>
              <button onClick={onCloseRegister} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {regError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* 1. Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Nama Lengkap *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Nama sesuai KTP..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                    required
                  />
                </div>
              </div>

              {/* 2. Email & 3. Nomor HP (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="contoh@email.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. Nomor HP *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 4. Instansi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. Instansi / Lembaga / Profesi
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regAgency}
                    onChange={(e) => setRegAgency(e.target.value)}
                    placeholder="Misal: Mahasiswa / Advokat / KPU / Bawaslu / Masyarakat Umum"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                  />
                </div>
              </div>

              {/* 5. Tanggal Lahir & 6. Tahun Lahir (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    5. Tanggal Lahir
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="date"
                      value={regBirthDate}
                      onChange={(e) => setRegBirthDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    6. Tahun Lahir
                  </label>
                  <input
                    type="number"
                    min="1940"
                    max="2015"
                    value={regBirthYear}
                    onChange={(e) => setRegBirthYear(e.target.value)}
                    placeholder="Misal: 1995"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                  />
                </div>
              </div>

              {/* 7. Password & 8. Konfirmasi Password (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    7. Kata Sandi *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    8. Konfirmasi Kata Sandi *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-stone-50"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRegLoading}
                  className="w-full py-3 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
                >
                  {isRegLoading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center text-xs text-slate-600">
              Sudah memiliki akun terdaftar?{' '}
              <button
                onClick={() => {
                  onCloseRegister();
                  onOpenLogin();
                }}
                className="font-bold text-red-700 hover:underline"
              >
                Masuk di Sini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROFILE MODAL */}
      {profileOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-red-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-5">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                <UserIcon className="w-5 h-5 text-red-700" />
                <span>Profil Pengguna</span>
              </div>
              <button onClick={onCloseProfile} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {profError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{profError}</span>
              </div>
            )}

            {profSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{profSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-stone-100 rounded-xl mb-2">
                <div className="w-12 h-12 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-lg">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{user.fullName}</div>
                  <div className="text-xs text-slate-500">{user.email} • Role: {user.role.toUpperCase()}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={profFullName}
                  onChange={(e) => setProfFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor HP
                  </label>
                  <input
                    type="text"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instansi / Profesi
                  </label>
                  <input
                    type="text"
                    value={profAgency}
                    onChange={(e) => setProfAgency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              {/* Password change option */}
              <div className="pt-3 border-t border-stone-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Ubah Kata Sandi (Opsional)
                </span>
                <div className="space-y-2">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Kata sandi saat ini..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-600"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kata sandi baru (min 6 karakter)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    removeAuthToken();
                    onUserChanged(null);
                    onCloseProfile();
                  }}
                  className="text-xs font-bold text-red-700 hover:text-red-900"
                >
                  Keluar dari Akun
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onCloseProfile}
                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-semibold"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={isProfLoading}
                    className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition"
                  >
                    {isProfLoading ? 'Menyimpan...' : 'Simpan Profil'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
