import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { google } from 'googleapis';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper for Google OAuth2 Client
  const getOAuth2Client = (req: express.Request) => {
    const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  };

  // Initialize Gemini AI client
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({ apiKey });
  };

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // GOOGLE AUTH ROUTES
  app.get('/api/auth/google/url', (req, res) => {
    try {
      const oauth2Client = getOAuth2Client(req);
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ],
        prompt: 'consent'
      });
      res.json({ success: true, url });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        return res.status(400).send('Kode otorisasi tidak ditemukan.');
      }
      const oauth2Client = getOAuth2Client(req);
      const { tokens } = await oauth2Client.getToken(code);

      res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Otorisasi Google Berhasil</title></head>
          <body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
            <div style="background: #1e293b; max-width: 420px; margin: 0 auto; padding: 30px; border-radius: 16px; border: 1px solid #334155;">
              <h2 style="color: #10b981; margin-top: 0;">Autentikasi Google Sheets Berhasil!</h2>
              <p style="color: #94a3b8; font-size: 14px;">Akun Google Anda berhasil dihubungkan. Jendela ini akan tertutup secara otomatis...</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
                window.close();
              } else {
                window.location.href = '/?auth=success';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Error in google callback:', err);
      res.status(500).send('Gagal otorisasi Google: ' + err.message);
    }
  });

  // GOOGLE SHEETS EXPORT / SYNC ROUTE
  app.post('/api/sheets/export', async (req, res) => {
    try {
      const { tokens, classInfo, weights, students, spreadsheetId } = req.body;
      if (!tokens) {
        return res.status(401).json({ success: false, error: 'Token autentikasi Google tidak ditemukan.' });
      }

      const oauth2Client = getOAuth2Client(req);
      oauth2Client.setCredentials(tokens);

      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

      const wSikap = weights.sikap ?? 0;
      const wKehadiran = weights.kehadiran ?? 0;

      const headerRows = [
        [`FORMAT DAFTAR NILAI SISWA - ${classInfo.schoolName || 'SEKOLAH'}`],
        [`Mata Pelajaran: ${classInfo.subjectName}`, '', '', `Kelas: ${classInfo.className}`, '', `KKM/KKTP: ${classInfo.kkm}`],
        [`Guru Pengampu: ${classInfo.teacherName}`, '', '', `Semester / TA: ${classInfo.semester} - ${classInfo.academicYear}`],
        [`Bobot Nilai: Tugas (${weights.tugas}%), TP (${weights.tp}%), Formatif (${weights.formatif}%), Sumatif (${weights.sumatif}%), Sikap (${wSikap}%), Kehadiran (${wKehadiran}%)`],
        [],
        ['No', 'NIS', 'Nama Siswa', 'No Telp Ortu', 'Email', 'Nilai Tugas', 'TP 1', 'TP 2', 'TP 3', 'TP 4', 'TP 5', 'Rata-Rata TP', 'Nilai Formatif', 'Nilai Sumatif', 'Nilai Sikap', 'Nilai Kehadiran', 'Rata-Rata Akhir', 'Predikat', 'Status Ketuntasan', 'Catatan Guru']
      ];

      const dataRows = students.map((s: any, idx: number) => [
        idx + 1,
        s.nis || '',
        s.nama || '',
        s.teleponOrtu || '',
        s.email || '',
        s.nilaiTugas ?? '',
        s.nilaiTP1 ?? '',
        s.nilaiTP2 ?? '',
        s.nilaiTP3 ?? '',
        s.nilaiTP4 ?? '',
        s.nilaiTP5 ?? '',
        s.nilaiTP ?? '',
        s.nilaiFormatif ?? '',
        s.nilaiSumatif ?? '',
        s.nilaiSikap ?? '',
        s.nilaiKehadiran ?? '',
        s.rataRataAkhir ?? '',
        s.predikat || '',
        s.status || '',
        s.catatan || ''
      ]);

      const values = [...headerRows, ...dataRows];

      let targetSpreadsheetId = spreadsheetId;

      if (!targetSpreadsheetId) {
        const title = `Daftar Nilai ${classInfo.subjectName || 'Mapel'} - ${classInfo.className || 'Kelas'}`;
        const createRes = await sheets.spreadsheets.create({
          requestBody: {
            properties: { title },
            sheets: [{ properties: { title: 'Daftar Nilai' } }]
          }
        });
        targetSpreadsheetId = createRes.data.spreadsheetId;
      }

      await sheets.spreadsheets.values.clear({
        spreadsheetId: targetSpreadsheetId,
        range: 'Daftar Nilai!A1:Z500'
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: targetSpreadsheetId,
        range: 'Daftar Nilai!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });

      const url = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/edit`;

      res.json({
        success: true,
        spreadsheetId: targetSpreadsheetId,
        spreadsheetUrl: url,
        syncedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error in sheets export:', err);
      res.status(500).json({ success: false, error: err.message || 'Gagal sinkronisasi ke Google Sheets' });
    }
  });

  // GOOGLE SHEETS IMPORT ROUTE
  app.post('/api/sheets/import', async (req, res) => {
    try {
      const { tokens, spreadsheetId } = req.body;
      if (!tokens || !spreadsheetId) {
        return res.status(400).json({ success: false, error: 'Spreadsheet ID atau token tidak ditemukan.' });
      }

      const oauth2Client = getOAuth2Client(req);
      oauth2Client.setCredentials(tokens);

      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

      const getRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A1:Z300'
      });

      const rows = getRes.data.values;
      if (!rows || rows.length < 5) {
        return res.status(400).json({ success: false, error: 'Data spreadsheet kosong atau format tidak sesuai.' });
      }

      let headerIdx = -1;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i].map((c: any) => String(c).toLowerCase());
        if (r.includes('nama siswa') || r.includes('nama') || r.includes('nis')) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx === -1) {
        return res.status(400).json({ success: false, error: 'Header baris tidak ditemukan di Google Sheets' });
      }

      const headers = rows[headerIdx].map((h: any) => String(h).toLowerCase().trim());
      const idxNIS = headers.findIndex((h: string) => h.includes('nis'));
      const idxNama = headers.findIndex((h: string) => h.includes('nama'));
      const idxTelp = headers.findIndex((h: string) => h.includes('telp') || h.includes('hp') || h.includes('wa'));
      const idxEmail = headers.findIndex((h: string) => h.includes('email'));
      const idxTugas = headers.findIndex((h: string) => h.includes('tugas'));
      const idxTP1 = headers.findIndex((h: string) => h.includes('tp 1') || h === 'tp1');
      const idxTP2 = headers.findIndex((h: string) => h.includes('tp 2') || h === 'tp2');
      const idxTP3 = headers.findIndex((h: string) => h.includes('tp 3') || h === 'tp3');
      const idxTP4 = headers.findIndex((h: string) => h.includes('tp 4') || h === 'tp4');
      const idxTP5 = headers.findIndex((h: string) => h.includes('tp 5') || h === 'tp5');
      const idxTP = headers.findIndex((h: string) => h.includes('tp') && !h.includes('tp 1') && !h.includes('tp 2') && !h.includes('tp 3') && !h.includes('tp 4') && !h.includes('tp 5'));
      const idxFormatif = headers.findIndex((h: string) => h.includes('formatif'));
      const idxSumatif = headers.findIndex((h: string) => h.includes('sumatif'));
      const idxSikap = headers.findIndex((h: string) => h.includes('sikap'));
      const idxKehadiran = headers.findIndex((h: string) => h.includes('kehadiran') || h.includes('absen'));
      const idxCatatan = headers.findIndex((h: string) => h.includes('catatan') || h.includes('keterangan'));

      const parsedStudents = [];
      const parseNum = (val: any) => {
        if (val === null || val === undefined || val === '') return null;
        const n = parseFloat(String(val).replace(',', '.'));
        return isNaN(n) ? null : n;
      };

      for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const nama = idxNama !== -1 && row[idxNama] ? String(row[idxNama]).trim() : '';
        if (!nama || nama.toLowerCase().includes('rata-rata') || nama.toLowerCase().includes('nilai tertinggi')) continue;

        const tp1 = parseNum(idxTP1 !== -1 ? row[idxTP1] : null);
        const tp2 = parseNum(idxTP2 !== -1 ? row[idxTP2] : null);
        const tp3 = parseNum(idxTP3 !== -1 ? row[idxTP3] : null);
        const tp4 = parseNum(idxTP4 !== -1 ? row[idxTP4] : null);
        const tp5 = parseNum(idxTP5 !== -1 ? row[idxTP5] : null);

        const validTPs = [tp1, tp2, tp3, tp4, tp5].filter((v): v is number => v !== null);
        let avgTP = validTPs.length > 0
          ? Math.round((validTPs.reduce((a, b) => a + b, 0) / validTPs.length) * 100) / 100
          : parseNum(idxTP !== -1 ? row[idxTP] : null);

        parsedStudents.push({
          id: 'stu-' + Math.random().toString(36).substring(2, 9),
          nis: idxNIS !== -1 && row[idxNIS] ? String(row[idxNIS]) : '',
          nama,
          teleponOrtu: idxTelp !== -1 && row[idxTelp] ? String(row[idxTelp]) : '',
          email: idxEmail !== -1 && row[idxEmail] ? String(row[idxEmail]) : '',
          nilaiTugas: parseNum(idxTugas !== -1 ? row[idxTugas] : null),
          nilaiTP1: tp1,
          nilaiTP2: tp2,
          nilaiTP3: tp3,
          nilaiTP4: tp4,
          nilaiTP5: tp5,
          nilaiTP: avgTP,
          nilaiFormatif: parseNum(idxFormatif !== -1 ? row[idxFormatif] : null),
          nilaiSumatif: parseNum(idxSumatif !== -1 ? row[idxSumatif] : null),
          nilaiSikap: parseNum(idxSikap !== -1 ? row[idxSikap] : null),
          nilaiKehadiran: parseNum(idxKehadiran !== -1 ? row[idxKehadiran] : null),
          catatan: idxCatatan !== -1 && row[idxCatatan] ? String(row[idxCatatan]) : ''
        });
      }

      res.json({ success: true, students: parsedStudents });
    } catch (err: any) {
      console.error('Error in sheets import:', err);
      res.status(500).json({ success: false, error: err.message || 'Gagal mengimpor dari Google Sheets' });
    }
  });

  // API 1: AI Student Analysis & Remedial Recommendation
  app.post('/api/ai/analyze-student', async (req, res) => {
    try {
      const { studentName, subjectName, nilaiTugas, nilaiTP, nilaiFormatif, nilaiSumatif, nilaiSikap, nilaiKehadiran, rataRata, status, kkm } = req.body;
      const ai = getAiClient();

      const prompt = `Anda adalah seorang asisten AI konselor pendidikan Indonesia yang bijak dan ramah.
Analisis data nilai siswa berikut:
- Nama Siswa: ${studentName}
- Mata Pelajaran: ${subjectName}
- KKM/KKTP Target: ${kkm}
- Nilai Tugas: ${nilaiTugas ?? 'Belum ada'}
- Nilai TP (Tujuan Pembelajaran): ${nilaiTP ?? 'Belum ada'}
- Nilai Formatif: ${nilaiFormatif ?? 'Belum ada'}
- Nilai Sumatif: ${nilaiSumatif ?? 'Belum ada'}
- Nilai Sikap: ${nilaiSikap ?? 'Belum ada'}
- Nilai Kehadiran: ${nilaiKehadiran ?? 'Belum ada'}
- Rata-rata Akhir: ${rataRata ?? 'Belum lengkap'}
- Status: ${status}

Berikan tanggapan singkat dan terstruktur dalam bahasa Indonesia yang mencakup:
1. **Evaluasi Singkat**: Diagnosis kekuatan dan area yang perlu ditingkatkan.
2. **Rencana Aksi/Remedial**: 2-3 langkah konkret untuk siswa (misal latihan soal topik tertentu, bimbingan teman sebaya).
3. **Pesan Motivasi**: 1 kalimat inspiratif untuk siswa.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({ success: true, analysis: response.text });
    } catch (err: any) {
      console.error('Error in analyze-student:', err);
      res.status(500).json({ success: false, error: err.message || 'Gagal menghasilkan analisis AI' });
    }
  });

  // API 2: AI Class Overview & Strategy
  app.post('/api/ai/analyze-class', async (req, res) => {
    try {
      const { className, subjectName, summaryStats, studentsSample } = req.body;
      const ai = getAiClient();

      const prompt = `Anda adalah pakar pedagogi Kurikulum Merdeka Indonesia.
Berikut rekapitulasi kelas:
- Kelas: ${className}
- Mata Pelajaran: ${subjectName}
- Total Siswa: ${summaryStats.totalStudents}
- Siswa Tuntas: ${summaryStats.tuntasCount}
- Siswa Perlu Remedial: ${summaryStats.remedialCount}
- Nilai Belum Lengkap: ${summaryStats.incompleteCount}
- Rata-rata Kelas: ${summaryStats.averageClassGrade}
- Nilai Tertinggi: ${summaryStats.highestGrade}
- Nilai Terendah: ${summaryStats.lowestGrade}

Berikan rekap analisis pedagogis ringkas (maksimal 3 paragraf pendek) untuk guru:
1. **Tingkat Penguasaan Kelas**: Ringkasan performa secara umum.
2. **Rekomendasi Tindak Lanjut Guru**: Strategi pengayaan untuk yang tuntas & metode remedial untuk yang belum tuntas.
3. **Saran Pengingat/Evaluasi**: Area komponen nilai mana yang paling mendesak ditindaklanjuti.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({ success: true, analysis: response.text });
    } catch (err: any) {
      console.error('Error in analyze-class:', err);
      res.status(500).json({ success: false, error: err.message || 'Gagal menghasilkan analisis kelas' });
    }
  });

  // API 3: AI Draft Custom Reminder Message
  app.post('/api/ai/draft-reminder', async (req, res) => {
    try {
      const { studentName, parentName, subjectName, missingFields, currentScore, kkm, reminderType, tone } = req.body;
      const ai = getAiClient();

      const prompt = `Buatkan draf pesan pengingat WhatsApp resmi namun santun dari guru kepada Orang Tua/Wali Siswa dalam Bahasa Indonesia.
Detail:
- Nama Siswa: ${studentName}
- Mata Pelajaran: ${subjectName}
- Jenis Pengingat: ${reminderType} (Misal: tugas belum lengkap / pengingat remedial / jadwal tes)
- Komponen Nilai Kosong/Bermasalah: ${missingFields ? missingFields.join(', ') : 'Tidak ada'}
- Nilai Sekarang / KKM: ${currentScore} / KKM ${kkm}
- Nada Pesan: ${tone || 'Sopan, Persuasif, dan Mendukung'}

Pesan harus ringkas, jelas, ramah, dan siap dikirim via WhatsApp (sertakan format tebal *nama* jika perlu).`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({ success: true, draftMessage: response.text });
    } catch (err: any) {
      console.error('Error in draft-reminder:', err);
      res.status(500).json({ success: false, error: err.message || 'Gagal membuat draf pesan' });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
