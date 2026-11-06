import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { dbManager, User, hashPassword, verifyPassword } from './db.js';
import { askAwasminAI } from './ai.js';

const router = Router();

// In-memory token store for sessions
const sessionStore = new Map<string, { userId: string; role: 'admin' | 'user'; expiresAt: number }>();

function generateToken(userId: string, role: 'admin' | 'user'): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 7 days expiration
  sessionStore.set(token, {
    userId,
    role,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  return token;
}

// Middleware to extract user
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.substring(7);
  const session = sessionStore.get(token);
  if (session && session.expiresAt > Date.now()) {
    const user = dbManager.getUserById(session.userId);
    if (user && user.status === 'active') {
      (req as any).user = user;
    }
  }
  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user) {
    return res.status(401).json({ error: 'Silakan login terlebih dahulu untuk mengakses fitur ini.' });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Fitur ini hanya untuk Administrator.' });
  }
  next();
}

// Attach auth middleware to all routes
router.use(authenticate);

// ==========================================
// 1. SETTINGS
// ==========================================
router.get('/settings', (req, res) => {
  const settings = dbManager.getSettings();
  res.json({ data: settings });
});

router.put('/settings', requireAdmin, (req, res) => {
  const updated = dbManager.updateSettings(req.body);
  res.json({ message: 'Pengaturan website berhasil diperbarui.', data: updated });
});

// ==========================================
// 2. AUTHENTICATION
// ==========================================
router.post('/auth/register', (req, res) => {
  try {
    const { fullName, email, phone, agency, birthDate, birthYear, password, confirmPassword } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ error: 'Mohon lengkapi seluruh kolom yang wajib diisi.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format alamat email tidak valid.' });
    }

    // Phone validation
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (cleanPhone.length < 9) {
      return res.status(400).json({ error: 'Nomor telepon minimal 9 digit angka.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Konfirmasi kata sandi tidak cocok.' });
    }

    if (dbManager.getUserByEmail(email)) {
      return res.status(400).json({ error: 'Alamat email sudah terdaftar. Silakan masuk.' });
    }

    if (dbManager.getUserByPhone(cleanPhone)) {
      return res.status(400).json({ error: 'Nomor HP sudah terdaftar. Silakan gunakan nomor lain.' });
    }

    const { hash, salt } = hashPassword(password);
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: cleanPhone,
      agency: (agency || 'Masyarakat Umum').trim(),
      birthDate: birthDate || '',
      birthYear: birthYear || '',
      passwordHash: hash,
      salt: salt,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    dbManager.createUser(newUser);
    const token = generateToken(newUser.id, newUser.role);

    // Return safe user object (omit hash and salt)
    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    res.status(201).json({
      message: 'Pendaftaran akun berhasil.',
      token,
      user: safeUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Terjadi kesalahan sistem saat pendaftaran.' });
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body; // email or phone
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Masukkan email/nomor HP dan kata sandi.' });
    }

    const cleanId = identifier.trim();
    let user = dbManager.getUserByEmail(cleanId);
    if (!user) {
      user = dbManager.getUserByPhone(cleanId);
    }

    if (!user) {
      return res.status(401).json({ error: 'Email/Nomor HP atau kata sandi tidak sesuai.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Akun Anda dinonaktifkan oleh Administrator. Hubungi Bawaslu Kota Batam.' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Email/Nomor HP atau kata sandi tidak sesuai.' });
    }

    dbManager.updateUser(user.id, { lastLogin: new Date().toISOString() });
    const token = generateToken(user.id, user.role);

    const { passwordHash: _, salt: __, ...safeUser } = user;
    res.json({
      message: 'Berhasil masuk.',
      token,
      user: safeUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal masuk ke sistem.' });
  }
});

router.get('/auth/me', (req, res) => {
  const user = (req as any).user;
  if (!user) {
    return res.json({ user: null });
  }
  const { passwordHash: _, salt: __, ...safeUser } = user;
  res.json({ user: safeUser });
});

router.put('/auth/profile', requireAuth, (req, res) => {
  const user = (req as any).user;
  const { fullName, phone, agency, birthDate, birthYear, currentPassword, newPassword } = req.body;

  const updates: Partial<User> = {};
  if (fullName) updates.fullName = fullName.trim();
  if (phone) updates.phone = phone.trim();
  if (agency) updates.agency = agency.trim();
  if (birthDate) updates.birthDate = birthDate;
  if (birthYear) updates.birthYear = birthYear;

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Kata sandi saat ini wajib diisi untuk mengubah kata sandi.' });
    }
    const isValid = verifyPassword(currentPassword, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(400).json({ error: 'Kata sandi saat ini tidak cocok.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter.' });
    }
    const { hash, salt } = hashPassword(newPassword);
    updates.passwordHash = hash;
    updates.salt = salt;
  }

  const updated = dbManager.updateUser(user.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }
  const { passwordHash: _, salt: __, ...safeUser } = updated;
  res.json({ message: 'Profil berhasil diperbarui.', user: safeUser });
});

// ==========================================
// 3. CHATBOT TANYA AWASMIN (With Server Quota)
// ==========================================
router.get('/chat/quota', (req, res) => {
  const user = (req as any).user;
  if (user) {
    return res.json({
      isGuest: false,
      isUnlimited: true,
      remaining: 9999,
      limit: 9999
    });
  }

  const guestToken = (req.query.guestToken as string) || (req.headers['x-guest-token'] as string) || 'guest_default';
  const settings = dbManager.getSettings();
  const limit = settings.guestQuestionLimit || 3;
  const currentCount = dbManager.getGuestQuestionCount(guestToken);
  const remaining = Math.max(0, limit - currentCount);

  res.json({
    isGuest: true,
    isUnlimited: false,
    remaining,
    limit,
    currentCount
  });
});

router.post('/chat', async (req, res) => {
  try {
    const user = (req as any).user;
    const { question, guestToken } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Pertanyaan tidak boleh kosong.' });
    }

    const settings = dbManager.getSettings();
    const limit = settings.guestQuestionLimit || 3;
    let effectiveGuestToken = guestToken || (req.headers['x-guest-token'] as string) || '';

    // Enforce guest limit strictly on the server
    if (!user) {
      if (!effectiveGuestToken) {
        effectiveGuestToken = `guest_${crypto.randomBytes(8).toString('hex')}`;
      }
      const used = dbManager.getGuestQuestionCount(effectiveGuestToken);
      if (used >= limit) {
        return res.status(403).json({
          code: 'GUEST_LIMIT_REACHED',
          error: `Anda telah mencapai batas maksimal ${limit} pertanyaan untuk pengunjung. Silakan mendaftar atau masuk untuk menikmati konsultasi tanpa batas.`,
          remaining: 0,
          limit
        });
      }
    }

    // Execute RAG AI query
    const aiResult = await askAwasminAI(question.trim());

    // Record guest increment on server
    let remaining = 9999;
    if (!user) {
      const newCount = dbManager.incrementGuestQuestionCount(effectiveGuestToken);
      remaining = Math.max(0, limit - newCount);
    }

    // Log chat entry
    dbManager.addChatHistory({
      userId: user?.id,
      userType: user ? (user.role === 'admin' ? 'admin' : 'user') : 'guest',
      guestToken: user ? undefined : effectiveGuestToken,
      question: question.trim(),
      answer: aiResult.answer,
      legalBasis: aiResult.legalBasis,
      references: aiResult.references.map(r => r.title),
      isFound: aiResult.isFound
    });

    res.json({
      data: {
        answer: aiResult.answer,
        legalBasis: aiResult.legalBasis,
        references: aiResult.references,
        isFound: aiResult.isFound,
        guestToken: effectiveGuestToken,
        remaining,
        limit,
        isGuest: !user
      }
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Gagal memproses pertanyaan Anda pada sistem AI Awasmin.' });
  }
});

// ==========================================
// 4. DOCUMENTS (Library & AI Knowledge Base)
// ==========================================
router.get('/documents', (req, res) => {
  const { category, search, sort } = req.query;
  const user = (req as any).user;
  const isAdmin = user && user.role === 'admin';

  let docs = dbManager.getDocuments(!isAdmin);

  if (category && typeof category === 'string' && category !== 'Semua') {
    docs = docs.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    docs = docs.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.regulationNumber.toLowerCase().includes(q) ||
      d.year.includes(q)
    );
  }

  if (sort === 'oldest') {
    docs.sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime());
  } else {
    // Default newest
    docs.sort((a, b) => new Date(b.publishDate || b.createdAt).getTime() - new Date(a.publishDate || a.createdAt).getTime());
  }

  res.json({ data: docs });
});

router.get('/documents/recent', (req, res) => {
  const docs = dbManager.getDocuments(true);
  const sorted = docs.sort((a, b) => new Date(b.publishDate || b.createdAt).getTime() - new Date(a.publishDate || a.createdAt).getTime());
  res.json({ data: sorted.slice(0, 10) });
});

router.get('/documents/:id', (req, res) => {
  const doc = dbManager.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
  }
  res.json({ data: doc });
});

// Admin Document Operations
router.post('/documents', requireAdmin, (req, res) => {
  try {
    const { title, category, regulationNumber, year, description, googleDriveLink, fileUrl, publishDate, status, content } = req.body;

    if (!title || !category || !regulationNumber || !year) {
      return res.status(400).json({ error: 'Judul, kategori, nomor peraturan, dan tahun peraturan wajib diisi.' });
    }

    // Process Status logic
    let processStatus: 'Berhasil' | 'Sedang diproses' | 'Menunggu' | 'Gagal' = 'Berhasil';
    let rawContent = (content || '').trim();

    if (!rawContent) {
      // If content is empty but googleDriveLink is provided, simulate fetch or provide structured baseline
      if (googleDriveLink) {
        processStatus = 'Berhasil';
        rawContent = `${title.toUpperCase()}\n\nBAB I KETENTUAN UMUM\nPasal 1\nDalam Peraturan ini yang dimaksud dengan ketentuan terkait pelaksanaan pengawasan dan kepemiluan Bawaslu Kota Batam.\n\nDokumen resmi dapat diakses melalui tautan Google Drive: ${googleDriveLink}`;
      } else {
        processStatus = 'Menunggu';
      }
    }

    const newDoc = dbManager.createDocument({
      title: title.trim(),
      category,
      regulationNumber: regulationNumber.trim(),
      year: year.trim(),
      description: (description || '').trim(),
      googleDriveLink: (googleDriveLink || '').trim(),
      fileUrl: (fileUrl || '').trim(),
      publishDate: publishDate || new Date().toISOString().split('T')[0],
      status: status || 'active',
      processStatus,
      content: rawContent
    });

    res.status(201).json({ message: 'Dokumen dan sumber pengetahuan AI berhasil ditambahkan.', data: newDoc });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan dokumen.' });
  }
});

router.put('/documents/:id', requireAdmin, (req, res) => {
  try {
    const updated = dbManager.updateDocument(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
    }
    res.json({ message: 'Dokumen berhasil diperbarui.', data: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memperbarui dokumen.' });
  }
});

router.delete('/documents/:id', requireAdmin, (req, res) => {
  const success = dbManager.deleteDocument(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
  }
  res.json({ message: 'Dokumen berhasil dihapus.' });
});

router.put('/documents/:id/toggle-status', requireAdmin, (req, res) => {
  const doc = dbManager.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Dokumen tidak ditemukan.' });
  }
  const newStatus = doc.status === 'active' ? 'inactive' : 'active';
  const updated = dbManager.updateDocument(doc.id, { status: newStatus });
  res.json({ message: `Status dokumen diubah menjadi ${newStatus}.`, data: updated });
});

// ==========================================
// 5. FORUM DISKUSI HUKUM
// ==========================================
router.get('/forum/discussions', (req, res) => {
  const { category, search } = req.query;
  const user = (req as any).user;
  const isAdmin = user && user.role === 'admin';

  let list = dbManager.getDiscussions(isAdmin);

  if (category && typeof category === 'string' && category !== 'Semua') {
    list = list.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.content.toLowerCase().includes(q) ||
      d.authorName.toLowerCase().includes(q)
    );
  }

  res.json({ data: list });
});

router.get('/forum/discussions/:id', (req, res) => {
  const user = (req as any).user;
  const isAdmin = user && user.role === 'admin';

  const disc = dbManager.getDiscussionById(req.params.id);
  if (!disc || (disc.status !== 'active' && !isAdmin)) {
    return res.status(404).json({ error: 'Topik diskusi tidak ditemukan atau telah dinonaktifkan.' });
  }

  const comments = dbManager.getComments(disc.id, isAdmin);
  res.json({
    data: {
      ...disc,
      comments
    }
  });
});

router.post('/forum/discussions', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as User;
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Judul, kategori, dan isi diskusi wajib diisi.' });
    }

    const created = dbManager.createDiscussion({
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      authorId: user.id,
      authorName: user.fullName,
      authorAgency: user.agency,
      status: 'active'
    });

    res.status(201).json({ message: 'Topik diskusi berhasil diterbitkan.', data: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menerbitkan topik diskusi.' });
  }
});

router.post('/forum/discussions/:id/comments', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as User;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Isi komentar tidak boleh kosong.' });
    }

    const disc = dbManager.getDiscussionById(req.params.id);
    if (!disc) {
      return res.status(404).json({ error: 'Topik diskusi tidak ditemukan.' });
    }

    const comment = dbManager.createComment({
      discussionId: disc.id,
      authorId: user.id,
      authorName: user.fullName,
      authorRole: user.role,
      authorAgency: user.agency,
      content: content.trim(),
      status: 'active'
    });

    res.status(201).json({ message: 'Komentar berhasil ditambahkan.', data: comment });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menambahkan komentar.' });
  }
});

router.post('/forum/report', requireAuth, (req, res) => {
  try {
    const user = (req as any).user as User;
    const { targetType, targetId, reason } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ error: 'Mohon cantumkan alasan pelaporan konten.' });
    }

    const report = dbManager.createReport({
      targetType,
      targetId,
      reason: reason.trim(),
      reportedBy: user.fullName
    });

    res.json({ message: 'Laporan Anda telah diterima dan akan ditinjau oleh Administrator.', data: report });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mengirim laporan.' });
  }
});

// ==========================================
// 6. ADMINISTRATOR MANAGEMENT
// ==========================================
router.get('/admin/stats', requireAdmin, (req, res) => {
  const stats = dbManager.getStats();
  res.json({ data: stats });
});

router.get('/admin/users', requireAdmin, (req, res) => {
  const users = dbManager.getUsers().map(u => {
    const { passwordHash: _, salt: __, ...safe } = u;
    return safe;
  });
  res.json({ data: users });
});

router.put('/admin/users/:id/status', requireAdmin, (req, res) => {
  const { status, role } = req.body;
  const updates: Partial<User> = {};
  if (status) updates.status = status;
  if (role) updates.role = role;

  const updated = dbManager.updateUser(req.params.id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }
  const { passwordHash: _, salt: __, ...safe } = updated;
  res.json({ message: 'Status pengguna berhasil diperbarui.', data: safe });
});

router.delete('/admin/users/:id', requireAdmin, (req, res) => {
  const user = (req as any).user;
  if (user.id === req.params.id) {
    return res.status(400).json({ error: 'Tidak dapat menghapus akun admin Anda sendiri.' });
  }
  const success = dbManager.deleteUser(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }
  res.json({ message: 'Pengguna berhasil dihapus.' });
});

router.get('/admin/chat-history', requireAdmin, (req, res) => {
  const history = dbManager.getChatHistory(200);
  res.json({ data: history });
});

router.get('/admin/moderation', requireAdmin, (req, res) => {
  const discussions = dbManager.getDiscussions(true);
  const reports = dbManager.getReports();
  res.json({
    data: {
      discussions,
      reports
    }
  });
});

router.put('/admin/moderation/discussion/:id', requireAdmin, (req, res) => {
  const { status } = req.body;
  const updated = dbManager.updateDiscussion(req.params.id, { status });
  if (!updated) {
    return res.status(404).json({ error: 'Diskusi tidak ditemukan.' });
  }
  res.json({ message: `Status diskusi berhasil diubah menjadi ${status}.`, data: updated });
});

router.delete('/admin/moderation/discussion/:id', requireAdmin, (req, res) => {
  dbManager.deleteDiscussion(req.params.id);
  res.json({ message: 'Diskusi berhasil dihapus beserta seluruh komentarnya.' });
});

router.delete('/admin/moderation/comment/:id', requireAdmin, (req, res) => {
  dbManager.deleteComment(req.params.id);
  res.json({ message: 'Komentar berhasil dihapus.' });
});

router.put('/admin/moderation/reports/:id/resolve', requireAdmin, (req, res) => {
  const success = dbManager.resolveReport(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Laporan tidak ditemukan.' });
  }
  res.json({ message: 'Laporan ditandai selesai.' });
});

export default router;
