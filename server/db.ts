import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  agency: string;
  birthDate: string;
  birthYear: string;
  passwordHash: string;
  salt: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface DocumentChunk {
  id: string;
  pasal?: string;
  bab?: string;
  text: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  category: 'UU Pemilu' | 'Perbawaslu' | 'PKPU' | 'Peraturan Terkait';
  regulationNumber: string;
  year: string;
  description: string;
  googleDriveLink: string;
  fileUrl?: string;
  publishDate: string;
  status: 'active' | 'inactive';
  processStatus: 'Menunggu' | 'Sedang diproses' | 'Berhasil' | 'Gagal';
  errorMessage?: string;
  content: string;
  chunks: DocumentChunk[];
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionComment {
  id: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'user';
  authorAgency?: string;
  content: string;
  createdAt: string;
  status: 'active' | 'hidden';
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  authorAgency?: string;
  createdAt: string;
  status: 'active' | 'hidden';
  reportCount: number;
  commentsCount: number;
}

export interface ContentReport {
  id: string;
  targetType: 'discussion' | 'comment';
  targetId: string;
  reason: string;
  reportedBy: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

export interface ChatHistoryEntry {
  id: string;
  userId?: string;
  userType: 'guest' | 'user' | 'admin';
  guestToken?: string;
  question: string;
  answer: string;
  legalBasis: string[];
  references: string[];
  isFound: boolean;
  createdAt: string;
}

export interface SiteSettings {
  appName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  bannerHeadline: string;
  bannerSubline: string;
  officeAddress: string;
  contactPhone: string;
  contactEmail: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  fallbackMessage: string;
  guestQuestionLimit: number;
}

export interface DatabaseSchema {
  settings: SiteSettings;
  users: User[];
  documents: LegalDocument[];
  discussions: Discussion[];
  comments: DiscussionComment[];
  reports: ContentReport[];
  chatHistory: ChatHistoryEntry[];
  guestSessions: Record<string, { count: number; lastAsked: string }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Password utility
export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return verify === hash;
}

// Chunker utility for legal texts
export function chunkLegalContent(docTitle: string, content: string): DocumentChunk[] {
  if (!content) return [];
  // Split by articles (Pasal X) or sections
  const lines = content.split('\n');
  const chunks: DocumentChunk[] = [];
  let currentChunk: string[] = [];
  let currentPasal = '';
  let currentBab = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const babMatch = line.match(/^BAB\s+([IVXLCDM]+|[0-9]+)\b/i);
    if (babMatch) {
      currentBab = line;
    }

    const pasalMatch = line.match(/^(Pasal\s+[0-9]+[A-Za-z]?)/i);
    if (pasalMatch) {
      if (currentChunk.length > 0) {
        chunks.push({
          id: crypto.randomUUID(),
          pasal: currentPasal || undefined,
          bab: currentBab || undefined,
          text: currentChunk.join('\n')
        });
        currentChunk = [];
      }
      currentPasal = pasalMatch[1];
    }

    currentChunk.push(line);

    // If chunk gets too long, split
    if (currentChunk.join('\n').length > 1200) {
      chunks.push({
        id: crypto.randomUUID(),
        pasal: currentPasal || undefined,
        bab: currentBab || undefined,
        text: currentChunk.join('\n')
      });
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    chunks.push({
      id: crypto.randomUUID(),
      pasal: currentPasal || undefined,
      bab: currentBab || undefined,
      text: currentChunk.join('\n')
    });
  }

  return chunks;
}

// Initial seed data with authentic Indonesian Election laws & Bawaslu regulations
function getInitialSeedData(): DatabaseSchema {
  const adminPwd = hashPassword('adminbawaslu123');
  const userPwd = hashPassword('user123456');

  const defaultAdmin: User = {
    id: 'usr_admin_01',
    fullName: 'Administrator Bawaslu Batam',
    email: 'admin@bawaslu.go.id',
    phone: '081270001122',
    agency: 'Bawaslu Kota Batam',
    birthDate: '1988-08-17',
    birthYear: '1988',
    passwordHash: adminPwd.hash,
    salt: adminPwd.salt,
    role: 'admin',
    status: 'active',
    createdAt: '2025-01-01T08:00:00.000Z'
  };

  const defaultUser: User = {
    id: 'usr_user_01',
    fullName: 'Masyarakat Peduli Pemilu',
    email: 'masyarakat@batam.go.id',
    phone: '081364009988',
    agency: 'Masyarakat Umum / Akademisi Batam',
    birthDate: '1995-05-12',
    birthYear: '1995',
    passwordHash: userPwd.hash,
    salt: userPwd.salt,
    role: 'user',
    status: 'active',
    createdAt: '2025-01-05T09:30:00.000Z'
  };

  // Seed Documents
  const rawDocs = [
    {
      id: 'doc_uu_7_2017',
      title: 'Undang-Undang Republik Indonesia Nomor 7 Tahun 2017 tentang Pemilihan Umum',
      category: 'UU Pemilu' as const,
      regulationNumber: '7',
      year: '2017',
      description: 'Regulasi induk penyelenggaraan Pemilu di Indonesia yang mengatur asas, kelembagaan KPU, Bawaslu, DKPP, hak pilih, tahapan pemilu, kampanye, sanksi tindak pidana pemilu, serta politik uang.',
      googleDriveLink: 'https://drive.google.com/file/d/1BawasluBatamUU72017ElectionLaw/view',
      fileUrl: 'https://peraturan.go.id/id/uu-no-7-tahun-2017',
      publishDate: '2017-08-16',
      status: 'active' as const,
      processStatus: 'Berhasil' as const,
      content: `UNDANG-UNDANG REPUBLIK INDONESIA NOMOR 7 TAHUN 2017 TENTANG PEMILIHAN UMUM

BAB I KETENTUAN UMUM
Pasal 1
(1) Pemilihan Umum yang selanjutnya disebut Pemilu adalah sarana kedaulatan rakyat untuk memilih anggota Dewan Perwakilan Rakyat, anggota Dewan Perwakilan Daerah, Presiden dan Wakil Presiden, dan untuk memilih anggota Dewan Perwakilan Rakyat Daerah, yang dilaksanakan secara langsung, umum, bebas, rahasia, jujur, dan adil dalam Negara Kesatuan Republik Indonesia berdasarkan Pancasila dan Undang-Undang Dasar Negara Republik Indonesia Tahun 1945.
(2) Badan Pengawas Pemilu yang selanjutnya disebut Bawaslu adalah lembaga penyelenggara Pemilu yang bertugas mengawasi penyelenggaraan Pemilu di seluruh wilayah Negara Kesatuan Republik Indonesia.
(17) Bawaslu Kabupaten/Kota adalah lembaga pengawas Pemilu yang bertugas mengawasi penyelenggaraan Pemilu di wilayah kabupaten/kota.

BAB II ASAS DAN PRINSIP PENYELENGGARA PEMILU
Pasal 2
Pemilu dilaksanakan berdasarkan asas langsung, umum, bebas, rahasia, jujur, dan adil.
Pasal 3
Penyelenggara Pemilu harus berpedoman pada prinsip: mandiri, jujur, adil, berkepastian hukum, tertib, terbuka, proporsional, profesional, akuntabel, efektif, dan efisien.

BAB IV PENGAWASAN PEMILU (TUGAS DAN WEWENANG BAWASLU KABUPATEN/KOTA)
Pasal 101
Bawaslu Kabupaten/Kota bertugas:
a. mengawasi pelaksanaan tahapan penyelenggaraan Pemilu di wilayah kabupaten/kota;
b. mencegah dan menangani pelanggaran Pemilu serta sengketa proses Pemilu di wilayah kabupaten/kota;
c. mengawasi pelaksanaan sosialisasi penyelenggaraan Pemilu di wilayah kabupaten/kota;
d. mengevaluasi pengawasan Pemilu di wilayah kabupaten/kota.

Pasal 102
(1) Dalam melakukan pencegahan pelanggaran Pemilu dan sengketa proses Pemilu sebagaimana dimaksud dalam Pasal 101 huruf b, Bawaslu Kabupaten/Kota berwenang:
a. mengidentifikasi dan memetakan potensi kerawanan serta pelanggaran Pemilu di wilayah kabupaten/kota;
b. mengoordinasikan, menyupervisi, membimbing, memantau, dan mengevaluasi penyelenggaraan Pengawasan Pemilu oleh Panwaslu Kecamatan, Panwaslu Kelurahan/Desa, dan Pengawas TPS;
c. berkoordinasi dengan instansi pemerintah daerah terkait; dan
d. meningkatkan partisipasi masyarakat dalam pengawasan Pemilu di wilayah kabupaten/kota.

BAB VII KAMPANYE PEMILU DAN LARANGAN
Pasal 280
(1) Pelaksana, peserta, dan tim kampanye Pemilu dilarang:
a. mempersoalkan dasar negara Pancasila, Pembukaan Undang-Undang Dasar Negara Republik Indonesia Tahun 1945, dan bentuk Negara Kesatuan Republik Indonesia;
b. melakukan kegiatan yang membahayakan keutuhan Negara Kesatuan Republik Indonesia;
c. menghina seseorang, agama, suku, ras, golongan, calon, dan/atau Peserta Pemilu yang lain;
d. menghasut dan mengadu domba perseorangan ataupun masyarakat;
e. mengganggu ketertiban umum;
f. mengancam untuk melakukan kekerasan atau menganjurkan penggunaan kekerasan kepada seseorang, sekelompok anggota masyarakat, dan/atau Peserta Pemilu yang lain;
g. merusak dan/atau menghilangkan alat peraga kampanye Peserta Pemilu;
h. menggunakan fasilitas pemerintah, tempat ibadah, dan tempat pendidikan;
i. membawa atau menggunakan tanda gambar dan/atau atribut lain selain dari tanda gambar dan/atau atribut Peserta Pemilu yang bersangkutan; dan
j. menjanjikan atau memberikan uang atau materi lainnya kepada peserta Kampanye Pemilu (politik uang/money politics).
(2) Pelaksana dan/atau tim kampanye dalam kegiatan Kampanye Pemilu dilarang mengikutsertakan:
a. ketua, wakil ketua, ketua muda, hakim agung pada Mahkamah Agung, dan hakim pada semua badan peradilan di bawahnya;
b. ketua, wakil ketua, dan anggota Badan Pemeriksa Keuangan;
c. gubernur, deputi gubernur senior, dan deputi gubernur Bank Indonesia;
d. direksi, komisaris, dewan pengawas dan karyawan badan usaha milik negara/badan usaha milik daerah;
e. aparatur sipil negara (ASN);
f. anggota Tentara Nasional Indonesia dan Kepolisian Negara Republik Indonesia;
g. kepala desa;
h. perangkat desa;
i. anggota badan permusyawaratan desa.

Pasal 523 (SANKSI TINDAK PIDANA POLITIK UANG)
(1) Setiap pelaksana, peserta, dan/atau tim Kampanye Pemilu yang dengan sengaja menjanjikan atau memberikan uang atau materi lainnya sebagai imbalan kepada peserta Kampanye Pemilu secara langsung ataupun tidak langsung sebagaimana dimaksud dalam Pasal 280 ayat (1) huruf j dipidana dengan pidana penjara paling lama 2 (dua) tahun dan denda paling banyak Rp24.000.000,00 (dua puluh empat juta rupiah).
(2) Setiap pelaksana, peserta, dan/atau tim Kampanye Pemilu yang dengan sengaja pada Masa Tenang menjanjikan atau memberikan imbalan uang atau materi lainnya kepada Pemilih secara langsung ataupun tidak langsung dipidana dengan pidana penjara paling lama 4 (empat) tahun dan denda paling banyak Rp48.000.000,00 (empat puluh delapan juta rupiah).
(3) Setiap orang yang dengan sengaja pada hari pemungutan suara menjanjikan atau memberikan uang atau materi lainnya kepada Pemilih untuk tidak menggunakan hak pilihnya atau memilih Peserta Pemilu tertentu dipidana dengan pidana penjara paling lama 3 (tiga) tahun dan denda paling banyak Rp36.000.000,00 (tiga puluh enam juta rupiah).`
    },
    {
      id: 'doc_perbawaslu_7_2022',
      title: 'Peraturan Bawaslu Nomor 7 Tahun 2022 tentang Penanganan Temuan dan Laporan Pelanggaran Pemilihan Umum',
      category: 'Perbawaslu' as const,
      regulationNumber: '7',
      year: '2022',
      description: 'Pedoman tata cara penerimaan, verifikasi, registrasi, klarifikasi, pengkajian, dan pengambilan status terhadap temuan pengawas maupun laporan dugaan pelanggaran pemilu dari masyarakat.',
      googleDriveLink: 'https://drive.google.com/file/d/1BawasluBatamPerbawaslu72022Pelanggaran/view',
      fileUrl: 'https://bawaslu.go.id/id/peraturan/perbawaslu-no-7-tahun-2022',
      publishDate: '2022-10-21',
      status: 'active' as const,
      processStatus: 'Berhasil' as const,
      content: `PERATURAN BADAN PENGAWAS PEMILIHAN UMUM NOMOR 7 TAHUN 2022 TENTANG PENANGANAN TEMUAN DAN LAPORAN PELANGGARAN PEMILIHAN UMUM

BAB I KETENTUAN UMUM
Pasal 1
(1) Pelanggaran Pemilu adalah tindakan yang bertentangan, melanggar, atau tidak sesuai dengan peraturan perundang-undangan yang mengatur mengenai Pemilu.
(2) Temuan Dugaan Pelanggaran Pemilu yang selanjutnya disebut Temuan adalah dugaan Pelanggaran Pemilu yang berasal dari hasil Pengawasan Pengawas Pemilu pada setiap tahapan Penyelenggaraan Pemilu atau hasil Pengawasan non-tahapan.
(3) Laporan Dugaan Pelanggaran Pemilu yang selanjutnya disebut Laporan adalah dugaan Pelanggaran Pemilu yang disampaikan secara tertulis oleh Warga Negara Indonesia yang mempunyai hak pilih, Peserta Pemilu, atau Pemantau Pemilu kepada Pengawas Pemilu.

BAB II SUMBER DUGAAN PELANGGARAN
Pasal 3
(1) Dugaan Pelanggaran Pemilu bersumber dari:
a. Temuan; atau
b. Laporan.
(2) Pelanggaran Pemilu terdiri atas:
a. pelanggaran kode etik Penyelenggara Pemilu;
b. pelanggaran administratif Pemilu; dan
c. tindak pidana Pemilu.
(3) Selain pelanggaran Pemilu sebagaimana dimaksud pada ayat (2), Pengawas Pemilu juga menangani dugaan pelanggaran terhadap peraturan perundang-undangan lainnya seperti netralitas ASN, TNI, POLRI, dan Kepala Desa.

BAB III SYARAT LAPORAN DAN TENGGANG WAKTU
Pasal 8
(1) Laporan dugaan Pelanggaran Pemilu disampaikan secara tertulis dan memuat:
a. nama dan alamat Pelapor;
b. pihak Terlapor;
c. waktu dan tempat terjadinya peristiwa; dan
d. uraian kejadian.
(2) Laporan sebagaimana dimaksud pada ayat (1) harus memenuhi:
a. syarat formal: nama dan alamat Pelapor, identitas Pelapor (KTP-el atau identitas kependudukan), pihak Terlapor, dan waktu penyampaian tidak melebihi batas waktu;
b. syarat materiel: waktu dan tempat kejadian dugaan pelanggaran, uraian kejadian dugaan pelanggaran, serta bukti.
(3) Laporan disampaikan paling lama 7 (tujuh) hari kerja sejak diketahui terjadinya dugaan Pelanggaran Pemilu.

BAB IV PENANGANAN DAN JANGKA WAKTU KLARIFIKASI
Pasal 15
(1) Bawaslu, Bawaslu Provinsi, atau Bawaslu Kabupaten/Kota memutus status penanganan Laporan atau Temuan paling lama 7 (tujuh) hari kerja setelah Laporan atau Temuan diregistrasi.
(2) Dalam hal Bawaslu, Bawaslu Provinsi, atau Bawaslu Kabupaten/Kota memerlukan keterangan tambahan, penanganan Laporan atau Temuan dapat ditambah paling lama 7 (tujuh) hari kerja berikutnya.`
    },
    {
      id: 'doc_pkpu_15_2023',
      title: 'Peraturan KPU Nomor 15 Tahun 2023 tentang Kampanye Pemilihan Umum',
      category: 'PKPU' as const,
      regulationNumber: '15',
      year: '2023',
      description: 'Peraturan yang memuat metode kampanye, batas pemasangan alat peraga kampanye (APK), bahan kampanye, media sosial, iklan kampanye, serta larangan dalam kampanye pemilu.',
      googleDriveLink: 'https://drive.google.com/file/d/1BawasluBatamPKPU152023Kampanye/view',
      fileUrl: 'https://jdih.kpu.go.id/dokumen/detail/15-2023',
      publishDate: '2023-07-17',
      status: 'active' as const,
      processStatus: 'Berhasil' as const,
      content: `PERATURAN KOMISI PEMILIHAN UMUM NOMOR 15 TAHUN 2023 TENTANG KAMPANYE PEMILIHAN UMUM

BAB II METODE KAMPANYE PEMILU
Pasal 26
(1) Kampanye Pemilu dapat dilakukan melalui metode:
a. pertemuan terbatas;
b. pertemuan tatap muka;
c. penyebaran bahan Kampanye Pemilu kepada umum;
d. pemasangan alat peraga Kampanye Pemilu di tempat umum;
e. media sosial;
f. iklan media massa cetak, media massa elektronik, dan media daring;
g. rapat umum;
h. debat Pasangan Calon tentang materi Kampanye Pemilu Pasangan Calon; dan
i. kegiatan lain yang tidak melanggar larangan Kampanye Pemilu dan ketentuan peraturan perundang-undangan.

BAB IV ALAT PERAGA KAMPANYE (APK) DAN BAHAN KAMPANYE
Pasal 33
(1) Bahan Kampanye yang disebarkan kepada umum dapat berupa selebaran (flyer), brosur (leaflet), pamflet, poster, stiker, pakaian, penutup kepala, alat minum/makan, kalender, kartu nama, pin, dan/atau alat tulis.
(2) Setiap bahan Kampanye sebagaimana dimaksud pada ayat (1) apabila dikonversikan dalam bentuk uang bernilai paling tinggi Rp100.000,00 (seratus ribu rupiah) per item.

Pasal 70
(1) Alat Peraga Kampanye (APK) dilarang dipasang pada:
a. tempat ibadah termasuk halaman;
b. rumah sakit atau tempat pelayanan kesehatan;
c. gedung atau fasilitas milik pemerintah;
d. fasilitas tertentu milik TNI/Polri dan BUMN/BUMD; dan
e. jalan-jalan protokol tertentu, taman kota, pohon pelindung lingkungan hidup, dan jembatan penyeberangan orang sesuai keputusan pemerintah daerah setempat.`
    },
    {
      id: 'doc_asn_skb_2022',
      title: 'Surat Keputusan Bersama (SKB) tentang Pedoman Pembinaan dan Pengawasan Netralitas ASN dalam Penyelenggaraan Pemilu',
      category: 'Peraturan Terkait' as const,
      regulationNumber: 'SKB MenPAN-RB, Mendagri, BKN, KASN, Bawaslu',
      year: '2022',
      description: 'Pedoman penegakan netralitas Aparatur Sipil Negara (ASN), Pegawai Pemerintah dengan Perjanjian Kerja (PPPK), dan tenaga honorer di lingkungan instansi pusat dan pemerintah daerah.',
      googleDriveLink: 'https://drive.google.com/file/d/1BawasluBatamSKBNetralitasASN/view',
      fileUrl: 'https://menpan.go.id/dokumen/skb-netralitas-asn-2022',
      publishDate: '2022-09-22',
      status: 'active' as const,
      processStatus: 'Berhasil' as const,
      content: `SURAT KEPUTUSAN BERSAMA MENTERI PANRB, MENDAGRI, KEPALA BKN, KETUA KASN, DAN KETUA BAWASLU TENTANG PEDOMAN PEMBINAAN DAN PENGAWASAN NETRALITAS PEGAWAI APARATUR SIPIL NEGARA DALAM PENYELENGGARAAN PEMILIHAN UMUM

BAB I BENTUK PELANGGARAN NETRALITAS ASN
Bentuk-bentuk tindakan yang dilarang bagi ASN dalam Pemilu dan Pemilihan mencakup:
1. Mengunggah, menanggapi (seperti like, share, komentar), atau menyebarluaskan gambar, foto, visi-misi calon, atau tagar terkait peserta pemilu di media sosial;
2. Menghadiri deklarasi, konsolidasi, atau kampanye pasangan calon atau partai politik;
3. Berfoto bersama pasangan calon atau peserta pemilu dengan pose menunjukkan simbol tangan/jari yang mencerminkan nomor urut atau dukungan;
4. Menjadi pembicara, narasumber, atau moderator pada acara yang diadakan peserta pemilu;
5. Menggunakan fasilitas kedinasan seperti mobil dinas, ruang kantor, atau anggaran APBD/APBN untuk kepentingan pemenangan peserta pemilu;
6. Merekrut, mengarahkan, atau mengintimidasi bawahan atau warga untuk mendukung peserta pemilu tertentu.

BAB II TATA CARA PENANGANAN OLEH BAWASLU
1. Temuan atau laporan dugaan pelanggaran netralitas ASN disampaikan kepada Bawaslu / Bawaslu Kabupaten/Kota.
2. Bawaslu melakukan klarifikasi dan kajian hukum paling lama 7 (tujuh) hari kerja.
3. Apabila terbukti melanggar asas netralitas ASN, Bawaslu meneruskan rekomendasi sanksi kepada Komisi Aparatur Sipil Negara (KASN) / Badan Kepegawaian Negara (BKN) dan Pejabat Pembina Kepegawaian (PPK) instansi bersangkutan untuk dijatuhi sanksi disiplin ringan, sedang, atau berat.`
    },
    {
      id: 'doc_perbawaslu_8_2022',
      title: 'Peraturan Bawaslu Nomor 8 Tahun 2022 tentang Penyelesaian Sengketa Proses Pemilihan Umum',
      category: 'Perbawaslu' as const,
      regulationNumber: '8',
      year: '2022',
      description: 'Tata cara permohonan, mediasi, dan adjudikasi penyelesaian sengketa proses pemilu antara peserta pemilu dengan penyelenggara pemilu (KPU) atau antar peserta pemilu.',
      googleDriveLink: 'https://drive.google.com/file/d/1BawasluBatamPerbawaslu82022Sengketa/view',
      fileUrl: 'https://bawaslu.go.id/id/peraturan/perbawaslu-no-8-tahun-2022',
      publishDate: '2022-10-21',
      status: 'active' as const,
      processStatus: 'Berhasil' as const,
      content: `PERATURAN BADAN PENGAWAS PEMILIHAN UMUM NOMOR 8 TAHUN 2022 TENTANG PENYELESAIAN SENGKETA PROSES PEMILIHAN UMUM

BAB I KETENTUAN UMUM
Pasal 1
(1) Sengketa Proses Pemilu adalah sengketa yang terjadi antara Peserta Pemilu dengan Penyelenggara Pemilu (KPU/KPU Kabupaten/Kota) sebagai akibat dikeluarkannya Keputusan KPU atau Berita Acara KPU, atau sengketa yang terjadi antar-Peserta Pemilu.
(2) Permohonan Penyelesaian Sengketa Proses Pemilu disampaikan kepada Bawaslu, Bawaslu Provinsi, atau Bawaslu Kabupaten/Kota sesuai dengan lokus dan kewenangan.

BAB II TENGGANG WAKTU PENGAJUAN PERMOHONAN
Pasal 13
(1) Permohonan penyelesaian sengketa proses Pemilu diajukan paling lama 3 (tiga) hari kerja terhitung sejak tanggal penetapan keputusan KPU, KPU Provinsi, atau KPU Kabupaten/Kota atau Berita Acara KPU.
(2) Bawaslu Kabupaten/Kota melakukan verifikasi kelengkapan berkas formal dan materiel permohonan.

BAB III MEKANISME MEDIASI DAN ADJUDIKASI
Pasal 24
(1) Bawaslu Kabupaten/Kota menyelesaikan sengketa proses Pemilu paling lama 12 (dua belas) hari kerja sejak permohonan diregistrasi.
(2) Penyelesaian sengketa proses Pemilu dilakukan melalui tahapan:
a. mediasi secara tertutup paling lama 2 (dua) hari kerja;
b. adjudikasi secara terbuka apabila mediasi tidak mencapai kesepakatan.`
    }
  ];

  const processedDocs: LegalDocument[] = rawDocs.map(d => ({
    ...d,
    chunks: chunkLegalContent(d.title, d.content),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  const initialDiscussions: Discussion[] = [
    {
      id: 'disc_01',
      title: 'Bagaimana Batasan Pemasangan Baliho / APK di Dekat Fasilitas Umum di Kota Batam?',
      content: 'Halo rekan-rekan dan admin Bawaslu Kota Batam, saya ingin menanyakan mengenai radius larangan pemasangan Alat Peraga Kampanye (APK) di sekitar area sekolah dan rumah ibadah di wilayah Batam Kota. Mohon pencerahan dasar hukumnya.',
      category: 'Tahapan Kampanye',
      authorId: 'usr_user_01',
      authorName: 'Masyarakat Peduli Pemilu',
      authorAgency: 'Masyarakat Umum / Akademisi Batam',
      createdAt: '2025-02-10T10:00:00.000Z',
      status: 'active',
      reportCount: 0,
      commentsCount: 2
    },
    {
      id: 'disc_02',
      title: 'Syarat dan Batas Waktu Melaporkan Dugaan Politik Uang ke Bawaslu Kota Batam',
      content: 'Apakah laporan masyarakat terkait pembagian sembako atau amplop uang saat masa tenang memerlukan bukti video atau cukup saksi? Berapa lama batas waktu maksimal untuk melapor sejak peristiwa diketahui?',
      category: 'Penanganan Pelanggaran',
      authorId: 'usr_user_01',
      authorName: 'Masyarakat Peduli Pemilu',
      authorAgency: 'Masyarakat Umum / Akademisi Batam',
      createdAt: '2025-02-12T14:30:00.000Z',
      status: 'active',
      reportCount: 0,
      commentsCount: 1
    }
  ];

  const initialComments: DiscussionComment[] = [
    {
      id: 'comm_01',
      discussionId: 'disc_01',
      authorId: 'usr_admin_01',
      authorName: 'Administrator Bawaslu Batam',
      authorRole: 'admin',
      authorAgency: 'Bawaslu Kota Batam',
      content: 'Terima kasih atas pertanyaannya. Berdasarkan UU No. 7 Tahun 2017 Pasal 280 ayat (1) huruf h dan PKPU No. 15 Tahun 2023 Pasal 70, APK dilarang mutlak dipasang di tempat ibadah termasuk halamannya, rumah sakit/tempat pelayanan kesehatan, gedung pemerintah, dan sarana pendidikan. Untuk Kota Batam, Bawaslu bersama Pemko Batam juga mengeluarkan zonasi titik larangan termasuk jembatan dan pohon pelindung.',
      createdAt: '2025-02-10T11:15:00.000Z',
      status: 'active'
    },
    {
      id: 'comm_02',
      discussionId: 'disc_01',
      authorId: 'usr_user_01',
      authorName: 'Masyarakat Peduli Pemilu',
      authorRole: 'user',
      authorAgency: 'Masyarakat Umum / Akademisi Batam',
      content: 'Sangat jelas penjelasannya Pak Admin. Jika menemukan pelanggaran tersebut, apakah kami bisa langsung melapor ke Panwaslu Kecamatan terdekat?',
      createdAt: '2025-02-10T12:00:00.000Z',
      status: 'active'
    },
    {
      id: 'comm_03',
      discussionId: 'disc_02',
      authorId: 'usr_admin_01',
      authorName: 'Administrator Bawaslu Batam',
      authorRole: 'admin',
      authorAgency: 'Bawaslu Kota Batam',
      content: 'Berdasarkan Perbawaslu No. 7 Tahun 2022 Pasal 8, laporan harus disampaikan maksimal 7 hari kerja sejak diketahui peristiwa. Syarat materiel meliputi waktu, tempat kejadian, uraian peristiwa, dan bukti pendukung (dapat berupa rekaman video, foto, kwitansi, atau saksi minimal 2 orang). Laporan dapat dibawa ke kantor Bawaslu Batam di Komplek KBC Belian atau melalui saluran resmi kami.',
      createdAt: '2025-02-12T15:00:00.000Z',
      status: 'active'
    }
  ];

  const initialSettings: SiteSettings = {
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
    guestQuestionLimit: 3
  };

  return {
    settings: initialSettings,
    users: [defaultAdmin, defaultUser],
    documents: processedDocs,
    discussions: initialDiscussions,
    comments: initialComments,
    reports: [],
    chatHistory: [],
    guestSessions: {}
  };
}

class DatabaseManager {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.db = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...getInitialSeedData(),
          ...parsed,
          settings: { ...getInitialSeedData().settings, ...(parsed.settings || {}) },
          guestSessions: parsed.guestSessions || {}
        };
      }
    } catch (err) {
      console.error('Error reading db.json, generating seed data:', err);
    }
    const seed = getInitialSeedData();
    this.saveDatabase(seed);
    return seed;
  }

  private saveDatabase(data: DatabaseSchema) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db.json:', err);
    }
  }

  private persist() {
    this.saveDatabase(this.db);
  }

  // --- Settings ---
  getSettings(): SiteSettings {
    return this.db.settings;
  }

  updateSettings(updates: Partial<SiteSettings>): SiteSettings {
    this.db.settings = { ...this.db.settings, ...updates };
    this.persist();
    return this.db.settings;
  }

  // --- Users ---
  getUsers(): User[] {
    return this.db.users;
  }

  getUserById(id: string): User | undefined {
    return this.db.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserByPhone(phone: string): User | undefined {
    return this.db.users.find(u => u.phone === phone);
  }

  createUser(user: User): User {
    this.db.users.push(user);
    this.persist();
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.db.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.db.users[idx] = { ...this.db.users[idx], ...updates };
    this.persist();
    return this.db.users[idx];
  }

  deleteUser(id: string): boolean {
    const initialLen = this.db.users.length;
    this.db.users = this.db.users.filter(u => u.id !== id);
    if (this.db.users.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Documents ---
  getDocuments(onlyActive = false): LegalDocument[] {
    if (onlyActive) {
      return this.db.documents.filter(d => d.status === 'active');
    }
    return this.db.documents;
  }

  getDocumentById(id: string): LegalDocument | undefined {
    return this.db.documents.find(d => d.id === id);
  }

  createDocument(docData: Omit<LegalDocument, 'id' | 'createdAt' | 'updatedAt' | 'chunks'>): LegalDocument {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const chunks = chunkLegalContent(docData.title, docData.content);
    const newDoc: LegalDocument = {
      ...docData,
      id,
      chunks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.db.documents.unshift(newDoc);
    this.persist();
    return newDoc;
  }

  updateDocument(id: string, updates: Partial<LegalDocument>): LegalDocument | undefined {
    const idx = this.db.documents.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    
    // If content updated, re-chunk
    let chunks = this.db.documents[idx].chunks;
    if (updates.content && updates.content !== this.db.documents[idx].content) {
      chunks = chunkLegalContent(updates.title || this.db.documents[idx].title, updates.content);
    }

    this.db.documents[idx] = {
      ...this.db.documents[idx],
      ...updates,
      chunks,
      updatedAt: new Date().toISOString()
    };
    this.persist();
    return this.db.documents[idx];
  }

  deleteDocument(id: string): boolean {
    const initialLen = this.db.documents.length;
    this.db.documents = this.db.documents.filter(d => d.id !== id);
    if (this.db.documents.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Discussions & Comments ---
  getDiscussions(includeHidden = false): Discussion[] {
    let list = this.db.discussions;
    if (!includeHidden) {
      list = list.filter(d => d.status === 'active');
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getDiscussionById(id: string): Discussion | undefined {
    return this.db.discussions.find(d => d.id === id);
  }

  createDiscussion(discussion: Omit<Discussion, 'id' | 'createdAt' | 'reportCount' | 'commentsCount'>): Discussion {
    const newDisc: Discussion = {
      ...discussion,
      id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      reportCount: 0,
      commentsCount: 0
    };
    this.db.discussions.unshift(newDisc);
    this.persist();
    return newDisc;
  }

  updateDiscussion(id: string, updates: Partial<Discussion>): Discussion | undefined {
    const idx = this.db.discussions.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    this.db.discussions[idx] = { ...this.db.discussions[idx], ...updates };
    this.persist();
    return this.db.discussions[idx];
  }

  deleteDiscussion(id: string): boolean {
    this.db.discussions = this.db.discussions.filter(d => d.id !== id);
    this.db.comments = this.db.comments.filter(c => c.discussionId !== id);
    this.persist();
    return true;
  }

  getComments(discussionId: string, includeHidden = false): DiscussionComment[] {
    let list = this.db.comments.filter(c => c.discussionId === discussionId);
    if (!includeHidden) {
      list = list.filter(c => c.status === 'active');
    }
    return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  createComment(comment: Omit<DiscussionComment, 'id' | 'createdAt'>): DiscussionComment {
    const newComment: DiscussionComment = {
      ...comment,
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.db.comments.push(newComment);
    
    // update commentsCount
    const disc = this.db.discussions.find(d => d.id === comment.discussionId);
    if (disc) {
      disc.commentsCount = this.db.comments.filter(c => c.discussionId === comment.discussionId && c.status === 'active').length;
    }
    this.persist();
    return newComment;
  }

  updateComment(id: string, updates: Partial<DiscussionComment>): DiscussionComment | undefined {
    const idx = this.db.comments.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    this.db.comments[idx] = { ...this.db.comments[idx], ...updates };
    
    const disc = this.db.discussions.find(d => d.id === this.db.comments[idx].discussionId);
    if (disc) {
      disc.commentsCount = this.db.comments.filter(c => c.discussionId === disc.id && c.status === 'active').length;
    }

    this.persist();
    return this.db.comments[idx];
  }

  deleteComment(id: string): boolean {
    const comm = this.db.comments.find(c => c.id === id);
    if (!comm) return false;
    const discId = comm.discussionId;
    this.db.comments = this.db.comments.filter(c => c.id !== id);
    
    const disc = this.db.discussions.find(d => d.id === discId);
    if (disc) {
      disc.commentsCount = this.db.comments.filter(c => c.discussionId === discId && c.status === 'active').length;
    }
    this.persist();
    return true;
  }

  // --- Reports ---
  getReports(): ContentReport[] {
    return this.db.reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createReport(report: Omit<ContentReport, 'id' | 'createdAt' | 'status'>): ContentReport {
    const newReport: ContentReport = {
      ...report,
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    this.db.reports.unshift(newReport);

    if (report.targetType === 'discussion') {
      const disc = this.db.discussions.find(d => d.id === report.targetId);
      if (disc) disc.reportCount = (disc.reportCount || 0) + 1;
    }
    this.persist();
    return newReport;
  }

  resolveReport(id: string): boolean {
    const rep = this.db.reports.find(r => r.id === id);
    if (rep) {
      rep.status = 'resolved';
      this.persist();
      return true;
    }
    return false;
  }

  // --- Chat history ---
  getChatHistory(limit = 100): ChatHistoryEntry[] {
    return this.db.chatHistory.slice(0, limit);
  }

  addChatHistory(entry: Omit<ChatHistoryEntry, 'id' | 'createdAt'>): ChatHistoryEntry {
    const item: ChatHistoryEntry = {
      ...entry,
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.db.chatHistory.unshift(item);
    if (this.db.chatHistory.length > 500) {
      this.db.chatHistory = this.db.chatHistory.slice(0, 500);
    }
    this.persist();
    return item;
  }

  // --- Guest Quota Tracking (Server-side enforced) ---
  getGuestQuestionCount(guestToken: string): number {
    if (!guestToken) return 0;
    const session = this.db.guestSessions[guestToken];
    return session ? session.count : 0;
  }

  incrementGuestQuestionCount(guestToken: string): number {
    if (!guestToken) return 0;
    const current = this.db.guestSessions[guestToken] || { count: 0, lastAsked: new Date().toISOString() };
    current.count += 1;
    current.lastAsked = new Date().toISOString();
    this.db.guestSessions[guestToken] = current;
    this.persist();
    return current.count;
  }

  // --- Statistics for Admin ---
  getStats() {
    return {
      totalUsers: this.db.users.length,
      totalChatbotQuestions: this.db.chatHistory.length,
      totalDocuments: this.db.documents.length,
      totalDiscussions: this.db.discussions.length,
      totalComments: this.db.comments.length,
      recentDocuments: this.db.documents.slice(0, 5),
      recentDiscussions: this.db.discussions.slice(0, 5)
    };
  }
}

export const dbManager = new DatabaseManager();
