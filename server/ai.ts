import { GoogleGenAI } from '@google/genai';
import { dbManager, LegalDocument, DocumentChunk } from './db.js';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined in environment variables.');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface RelevantChunkResult {
  doc: LegalDocument;
  chunk: DocumentChunk;
  score: number;
}

// Tokenize and clean text for matching
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

// Indonesian stop words for legal search
const STOP_WORDS = new Set([
  'yang', 'untuk', 'pada', 'ke', 'dari', 'dan', 'di', 'ini', 'itu', 'dengan',
  'atau', 'ada', 'adalah', 'akan', 'bisa', 'dapat', 'saya', 'kamu', 'anda',
  'kami', 'mereka', 'apa', 'apakah', 'bagaimana', 'kapan', 'dimana', 'mengapa',
  'siapa', 'seperti', 'tentang', 'oleh', 'karena', 'jika', 'dalam', 'atas', 'bukan'
]);

// Scoring algorithm for RAG
export function retrieveRelevantChunks(query: string, documents: LegalDocument[], maxResults = 5): RelevantChunkResult[] {
  const rawTokens = tokenize(query);
  const queryTokens = rawTokens.filter(t => !STOP_WORDS.has(t));
  if (queryTokens.length === 0) return [];

  const results: RelevantChunkResult[] = [];

  for (const doc of documents) {
    if (doc.status !== 'active') continue;
    const docTitleTokens = tokenize(doc.title);
    const docNumber = doc.regulationNumber.toLowerCase();
    const docYear = doc.year.toLowerCase();

    for (const chunk of doc.chunks) {
      let score = 0;
      const chunkText = chunk.text.toLowerCase();
      const chunkPasal = (chunk.pasal || '').toLowerCase();

      // Check for exact numbers/years matching
      if (query.toLowerCase().includes(docNumber)) score += 3;
      if (query.toLowerCase().includes(docYear)) score += 2;
      if (chunkPasal && query.toLowerCase().includes(chunkPasal)) score += 10;

      // Check query tokens
      for (const token of queryTokens) {
        if (chunkPasal.includes(token)) score += 4;
        if (docTitleTokens.includes(token)) score += 2;

        const regex = new RegExp(`\\b${token}\\b`, 'g');
        const count = (chunkText.match(regex) || []).length;
        if (count > 0) {
          score += Math.min(count * 2, 8);
        } else if (chunkText.includes(token)) {
          score += 1;
        }
      }

      // Bonus for legal phrase matching with Indonesian roots
      const queryLower = query.toLowerCase();
      if ((queryLower.includes('politik uang') || queryLower.includes('money politics') || (queryLower.includes('uang') && queryLower.includes('sanksi'))) && 
          (chunkText.includes('politik uang') || chunkText.includes('uang atau materi') || chunkText.includes('pasal 523') || chunkText.includes('pasal 280'))) {
        score += 15;
      }
      if ((queryLower.includes('netral') || queryLower.includes('asn') || queryLower.includes('pns')) && 
          (chunkText.includes('netral') || chunkText.includes('asn') || chunkText.includes('panrb'))) {
        score += 15;
      }
      if ((queryLower.includes('sengketa') || queryLower.includes('mediasi') || queryLower.includes('adjudikasi')) && 
          (chunkText.includes('sengketa') || chunkText.includes('mediasi') || chunkText.includes('perbawaslu nomor 8'))) {
        score += 15;
      }
      if ((queryLower.includes('kampanye') || queryLower.includes('apk') || queryLower.includes('alat peraga') || queryLower.includes('baliho') || queryLower.includes('spanduk')) && 
          (chunkText.includes('kampanye') || chunkText.includes('alat peraga') || chunkText.includes('pasal 280') || chunkText.includes('pasal 70'))) {
        score += 15;
      }
      if ((queryLower.includes('lapor') || queryLower.includes('temuan') || queryLower.includes('pelanggaran')) && 
          (chunkText.includes('lapor') || chunkText.includes('temuan') || chunkText.includes('syarat formal') || chunkText.includes('7 (tujuh) hari'))) {
        score += 15;
      }
      if ((queryLower.includes('larang') || queryLower.includes('dilarang')) && 
          (chunkText.includes('larangan') || chunkText.includes('dilarang'))) {
        score += 8;
      }
      if ((queryLower.includes('sanksi') || queryLower.includes('pidana') || queryLower.includes('denda') || queryLower.includes('hukuman')) && 
          (chunkText.includes('sanksi') || chunkText.includes('pidana') || chunkText.includes('denda') || chunkText.includes('pasal 523'))) {
        score += 12;
      }
      if ((queryLower.includes('waktu') || queryLower.includes('lama') || queryLower.includes('hari') || queryLower.includes('tenggang')) &&
          (chunkText.includes('hari kerja') || chunkText.includes('hari') || chunkText.includes('paling lama'))) {
        score += 8;
      }

      if (score >= 4) {
        results.push({ doc, chunk, score });
      }
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

export interface ChatResponsePayload {
  answer: string;
  legalBasis: string[];
  references: { title: string; link?: string; category: string }[];
  isFound: boolean;
}

export async function askAwasminAI(query: string): Promise<ChatResponsePayload> {
  const settings = dbManager.getSettings();
  const fallbackText = settings.fallbackMessage || 
    "Maaf, informasi yang Anda tanyakan belum tersedia dalam basis data referensi Klinik Hukum Bawaslu Kota Batam. Silakan menghubungi layanan Klinik Hukum untuk mendapatkan informasi lebih lanjut.";

  // Step 1: Get active documents
  const activeDocs = dbManager.getDocuments(true);
  if (activeDocs.length === 0) {
    return {
      answer: fallbackText,
      legalBasis: [],
      references: [],
      isFound: false
    };
  }

  // Step 2: Retrieve relevant chunks
  const relevantResults = retrieveRelevantChunks(query, activeDocs, 4);

  // If no chunks match the query with adequate relevance
  if (relevantResults.length === 0 || relevantResults[0].score < 4) {
    return {
      answer: fallbackText,
      legalBasis: [],
      references: [],
      isFound: false
    };
  }

  // Step 3: Format references
  const usedDocsMap = new Map<string, LegalDocument>();
  const contextParts: string[] = [];

  for (const item of relevantResults) {
    usedDocsMap.set(item.doc.id, item.doc);
    contextParts.push(
      `--- DOKUMEN: ${item.doc.title} (Kategori: ${item.doc.category}, No: ${item.doc.regulationNumber}, Tahun: ${item.doc.year}) ---\n` +
      (item.chunk.pasal ? `[${item.chunk.pasal}]\n` : '') +
      item.chunk.text
    );
  }

  const contextText = contextParts.join('\n\n');
  const ai = getAIClient();

  // If Gemini API client is not configured, generate a deterministic direct rule synthesis from matched chunks
  if (!ai) {
    // Fallback direct legal extractor if API key is temporarily unavailable
    const firstDoc = relevantResults[0].doc;
    const firstChunk = relevantResults[0].chunk;
    const formatted = `**Jawaban:**\nBerdasarkan dokumen peraturan resmi yang tersedia di Klinik Hukum Bawaslu Kota Batam, hal tersebut diatur dalam ketentuan ${firstDoc.title}.\n\n**Dasar Hukum:**\n- ${firstDoc.title} (${firstDoc.category} Nomor ${firstDoc.regulationNumber} Tahun ${firstDoc.year})\n- ${firstChunk.pasal || 'Ketentuan Regulasi'}\n\n**Penjelasan:**\n${firstChunk.text.slice(0, 400)}...\n\n**Sumber Referensi:**\n${firstDoc.title} (${firstDoc.googleDriveLink || firstDoc.fileUrl || 'Arsip JDIH Bawaslu'})`;

    return {
      answer: formatted,
      legalBasis: [`${firstDoc.title} - ${firstChunk.pasal || 'Ketentuan Umum'}`],
      references: Array.from(usedDocsMap.values()).map(d => ({
        title: d.title,
        link: d.googleDriveLink || d.fileUrl,
        category: d.category
      })),
      isFound: true
    };
  }

  try {
    const prompt = `Anda adalah "Awasmin", asisten kecerdasan buatan resmi untuk Klinik Hukum Bawaslu Kota Batam.
Tugas Anda adalah memberikan jawaban konsultasi hukum kepemiluan kepada masyarakat secara akurat, lugas, santun, dan profesional.

PERATURAN MUTLAK (STRICT SAFETY CONSTRAINTS):
1. Anda HANYA BOLEH menjawab berdasarkan "DOKUMEN REFERENSI RESMI" di bawah ini.
2. DILARANG menggunakan pengetahuan umum di luar teks referensi, dilarang berspekulasi atau mengambil dari internet.
3. DILARANG mengarang nomor peraturan, pasal, ayat, atau konsekuensi hukum yang tidak tercantum dalam dokumen referensi.
4. JIKA jawaban TIDAK DITEMUKAN atau TIDAK CUKUP dalam dokumen referensi, Anda WAJIB menjawab persis seperti ini:
"${fallbackText}"
5. JIKA jawaban DITEMUKAN dalam dokumen referensi, format jawaban WAJIB mengikuti struktur ini secara rapi:

**Jawaban:**
[Ringkasan jawaban langsung atas pertanyaan pemustaka/masyarakat dalam bahasa Indonesia yang baik, jelas, dan mudah dimengerti]

**Dasar Hukum:**
- [Nama peraturan lengkap, nomor dan tahun peraturan]
- [Pasal dan ayat terkait yang spesifik mengatur hal tersebut]

**Penjelasan:**
[Penjelasan ringkas dan mendalam berdasarkan isi dokumen referensi tanpa mengubah makna atau tafsir hukum]

**Sumber Referensi:**
[Judul dokumen resmi dan nomor peraturan]

---
PERTANYAAN MASYARAKAT:
"${query}"

---
DOKUMEN REFERENSI RESMI:
${contextText}
---`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const outputText = response.text || fallbackText;
    const isStrictFallback = outputText.includes("belum tersedia dalam basis data referensi Klinik Hukum Bawaslu Kota Batam");

    const referencesList = isStrictFallback 
      ? [] 
      : Array.from(usedDocsMap.values()).map(d => ({
          title: d.title,
          link: d.googleDriveLink || d.fileUrl,
          category: d.category
        }));

    // Extract legal basis lines if present
    const legalBasisList: string[] = [];
    if (!isStrictFallback) {
      const matchDasar = outputText.match(/\*\*Dasar Hukum:\*\*([\s\S]*?)(?=\*\*Penjelasan:\*\*|$)/i);
      if (matchDasar && matchDasar[1]) {
        matchDasar[1]
          .split('\n')
          .map(l => l.replace(/^[-*•\s]+/, '').trim())
          .filter(l => l.length > 0)
          .forEach(l => legalBasisList.push(l));
      }
      if (legalBasisList.length === 0) {
        legalBasisList.push(`${relevantResults[0].doc.title} (No. ${relevantResults[0].doc.regulationNumber}/${relevantResults[0].doc.year})`);
      }
    }

    return {
      answer: outputText,
      legalBasis: legalBasisList,
      references: referencesList,
      isFound: !isStrictFallback
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      answer: fallbackText,
      legalBasis: [],
      references: [],
      isFound: false
    };
  }
}
