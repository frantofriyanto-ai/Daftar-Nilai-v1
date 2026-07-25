import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  DownloadCloud, 
  UploadCloud, 
  Sparkles,
  Link as LinkIcon,
  Code2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode2
} from 'lucide-react';
import { ClassSubjectInfo, GradeWeighting, CalculatedGrade, StudentGrade } from '../types';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  info: ClassSubjectInfo;
  weights: GradeWeighting;
  students: CalculatedGrade[];
  onImportStudents: (newStudents: StudentGrade[]) => void;
  showToast: (msg: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  info,
  weights,
  students,
  onImportStudents,
  showToast
}) => {
  const [tokens, setTokens] = useState<any>(() => {
    const saved = localStorage.getItem('google_sheets_tokens');
    return saved ? JSON.parse(saved) : null;
  });

  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('google_spreadsheet_id') || '';
  });

  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(() => {
    return localStorage.getItem('google_spreadsheet_url') || '';
  });

  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem('google_sheets_last_sync') || null;
  });

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [customSpreadsheetInput, setCustomSpreadsheetInput] = useState('');
  const [showAppsScript, setShowAppsScript] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Generate dynamic Apps Script code customized for current subject and weights
  const appsScriptCode = `/**
 * GOOGLE APPS SCRIPT - SISTEM DAFTAR NILAI AUTOMATION
 * Mata Pelajaran: ${info.subjectName} (${info.className})
 * Guru Pengampu: ${info.teacherName}
 * KKM/KKTP: ${info.kkm}
 */

// 1. TAMBAHKAN MENU KHUSUS SAAT SPREADSHEET DIBUKA
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🎓 DAFTAR NILAI AKADEMIK')
    .addItem('📝 Buat Initial Data / Sample Siswa', 'buatInitialData')
    .addItem('⚡ Hitung Ulang Nilai & Predikat', 'hitungNilaiOtomatis')
    .addItem('📊 Cek Summary Ketuntasan Kelas', 'tampilkanSummary')
    .addSeparator()
    .addItem('ℹ️ Petunjuk Penggunaan', 'tampilkanPetunjuk')
    .addToUi();
}

// 2. ISIKAN INITIAL DATA (HEADER METADATA + SAMPLE SISWA)
function buatInitialData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clearContents();
  
  // Format Header Metadata
  var header = [
    ["FORMAT DAFTAR NILAI SISWA - ${info.schoolName || 'SMA NEGERI 1 NUSANTARA'}"],
    ["Mata Pelajaran: ${info.subjectName}", "", "", "Kelas: ${info.className}", "", "KKM/KKTP: ${info.kkm}"],
    ["Guru Pengampu: ${info.teacherName}", "", "", "Semester / TA: ${info.semester} - ${info.academicYear}"],
    ["Bobot Nilai: Tugas (${weights.tugas}%), TP (${weights.tp}%), Formatif (${weights.formatif}%), Sumatif (${weights.sumatif}%), Sikap (${weights.sikap ?? 0}%), Kehadiran (${weights.kehadiran ?? 0}%)"],
    [],
    ["No", "NIS", "Nama Siswa", "No Telp Ortu", "Email", "Nilai Tugas", "TP 1", "TP 2", "TP 3", "TP 4", "TP 5", "Rata-Rata TP", "Nilai Formatif", "Nilai Sumatif", "Nilai Sikap", "Nilai Kehadiran", "Rata-Rata Akhir", "Predikat", "Status Ketuntasan", "Catatan Guru"]
  ];

  sheet.getRange(1, 1, header.length, 20).setValues(header);

  // Data Sample Siswa Initial
  var sampleStudents = [
    [1, "20261001", "Aditya Pratama", "081234567890", "aditya@example.com", 88, 85, 88, 82, 86, 84, "", 90, 87, 90, 95, "", "", "", "Sangat memahami materi aljabar."],
    [2, "20261002", "Anisa Rahmawati", "081298765432", "anisa@example.com", 75, 72, 70, 68, 70, 70, "", 68, 65, 85, 90, "", "", "", "Perlu latihan ekstra di persamaan kuadrat."],
    [3, "20261003", "Bagas Kurniawan", "081311223344", "bagas@example.com", 95, 90, 95, 92, 91, 92, "", 94, 96, 95, 100, "", "", "", "Siswa berprestasi tinggi."],
    [4, "20261004", "Dewi Lestari", "081555667788", "dewi@example.com", 80, 78, 80, 76, 78, 78, "", 82, 80, 88, 92, "", "", "", "Aktif saat diskusi kelompok."],
    [5, "20261005", "Fikri Hidayat", "081799001122", "fikri@example.com", 60, "", "", "", "", "", "", 65, "", 75, 80, "", "", "", "Tugas TP dan Sumatif belum diserahkan."],
    [6, "20261006", "Gita Gutawa", "081822334455", "gita@example.com", 85, 80, 82, 78, 80, 80, "", 78, 82, 90, 95, "", "", "", "Konsisten dan rajin."],
    [7, "20261007", "Hendra Wijaya", "081933445566", "hendra@example.com", "", 72, 74, 70, 72, 72, "", 70, 74, 82, 88, "", "", "", "Tugas 1 belum dikumpulkan."],
    [8, "20261008", "Indah Permata", "082144556677", "indah@example.com", 92, 90, 92, 88, 90, 90, "", 88, 91, 94, 98, "", "", "", "Kemampuan logika matang."],
    [9, "20261009", "Joko Susilo", "082255667788", "joko@example.com", 70, 68, 70, 65, 68, 69, "", 72, 60, 80, 85, "", "", "", "Nilai Sumatif di bawah KKTP."],
    [10, "20261010", "Kiki Amalia", "082366778899", "kiki@example.com", 88, 86, 88, 84, 86, 86, "", 84, 89, 92, 96, "", "", "", "Disiplin dan bertanggung jawab."]
  ];

  sheet.getRange(7, 1, sampleStudents.length, 20).setValues(sampleStudents);
  
  // Format Tampilan Baris Header
  sheet.getRange("A1:T1").setFontWeight("bold").setFontSize(12);
  sheet.getRange("A6:T6").setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
  
  hitungNilaiOtomatis();

  SpreadsheetApp.getUi().alert("✅ Initial Data & 10 Sample Siswa berhasil dibuat di Sheet!");
}

// 2. KALKULASI OTOMATIS RATA-RATA, PREDIKAT & STATUS KETUNTASAN
function hitungNilaiOtomatis() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 7) {
    SpreadsheetApp.getUi().alert('Tidak ada data siswa untuk dihitung.');
    return;
  }
  
  // Bobot Konfigurasi
  var bobotTugas = ${weights.tugas};
  var bobotTP = ${weights.tp};
  var bobotFormatif = ${weights.formatif};
  var bobotSumatif = ${weights.sumatif};
  var bobotSikap = ${weights.sikap ?? 0};
  var bobotKehadiran = ${weights.kehadiran ?? 0};
  var totalBobot = bobotTugas + bobotTP + bobotFormatif + bobotSumatif + bobotSikap + bobotKehadiran || 100;
  var kkm = ${info.kkm};

  var range = sheet.getRange(7, 1, lastRow - 6, 20);
  var values = range.getValues();

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    var nama = row[2]; // Kolom C = Nama
    if (!nama || String(nama).toLowerCase().indexOf('rata-rata') !== -1) continue;

    var tugas = parseFloat(row[5]) || 0;
    
    // Hitung rata-rata TP (Kolom G - K)
    var tpVals = [];
    for (var j = 6; j <= 10; j++) {
      if (row[j] !== "" && !isNaN(row[j])) tpVals.push(parseFloat(row[j]));
    }
    var rataTP = tpVals.length > 0 ? (tpVals.reduce(function(a, b){ return a + b; }, 0) / tpVals.length) : (parseFloat(row[11]) || 0);
    
    var formatif = parseFloat(row[12]) || 0;
    var sumatif = parseFloat(row[13]) || 0;
    var sikap = parseFloat(row[14]) || 0;
    var kehadiran = parseFloat(row[15]) || 0;

    // Hitung Nilai Akhir Terbobot
    var nilaiAkhir = Math.round(((tugas * bobotTugas) + (rataTP * bobotTP) + (formatif * bobotFormatif) + (sumatif * bobotSumatif) + (sikap * bobotSikap) + (kehadiran * bobotKehadiran)) / totalBobot * 100) / 100;

    // Hitung Predikat
    var predikat = '-';
    if (nilaiAkhir >= 90) predikat = 'A';
    else if (nilaiAkhir >= 80) predikat = 'B';
    else if (nilaiAkhir >= 70) predikat = 'C';
    else predikat = 'D';

    // Status Ketuntasan
    var status = nilaiAkhir >= kkm ? 'Tuntas' : 'Belum Tuntas';

    // Update sel di Google Sheets (Kolom L, Q, R, S)
    sheet.getRange(7 + i, 12).setValue(Math.round(rataTP * 100) / 100); // Rata TP
    sheet.getRange(7 + i, 17).setValue(nilaiAkhir); // Rata Akhir
    sheet.getRange(7 + i, 18).setValue(predikat); // Predikat
    sheet.getRange(7 + i, 19).setValue(status); // Status
  }

  SpreadsheetApp.getUi().alert('✅ Perhitungan nilai & predikat selesai!');
}

// 3. TAMPILKAN SUMMARY KETUNTASAN
function tampilkanSummary() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var values = sheet.getDataRange().getValues();
  var totalSiswa = 0;
  var tuntas = 0;
  var belumTuntas = 0;

  for (var i = 6; i < values.length; i++) {
    var nama = values[i][2];
    if (!nama || String(nama).toLowerCase().indexOf('rata-rata') !== -1) continue;
    totalSiswa++;
    var status = values[i][18];
    if (status === 'Tuntas') tuntas++;
    else if (status === 'Belum Tuntas') belumTuntas++;
  }

  var msg = '📊 RINGKASAN KELAS:\\n\\n' +
            '• Total Siswa: ' + totalSiswa + ' siswa\\n' +
            '• Siswa Tuntas: ' + tuntas + ' (' + (totalSiswa ? Math.round(tuntas/totalSiswa*100) : 0) + '%)\\n' +
            '• Remedial/Belum Tuntas: ' + belumTuntas + ' siswa\\n' +
            '• KKM Mapel: ${info.kkm}';
            
  SpreadsheetApp.getUi().alert(msg);
}

// 4. OTOMATIS HITUNG SAAT ADA PERUBAHAN DATA (ON EDIT TRIGGER)
function onEdit(e) {
  var range = e.range;
  var col = range.getColumn();
  // Hanya jalankan jika yang diedit adalah kolom Nilai (Kolom F - P / Kolom 6 - 16)
  if (col >= 6 && col <= 16) {
    hitungNilaiOtomatis();
  }
}

function tampilkanPetunjuk() {
  SpreadsheetApp.getUi().alert('ℹ️ CARA PENGGUNAAN:\\n\\n1. Masukkan nilai siswa pada kolom Nilai Tugas, TP1-TP5, Formatif, Sumatif, Sikap, dan Kehadiran.\\n2. Nilai Rata-rata Akhir, Predikat, dan Status Ketuntasan akan otomatis dihitung.\\n3. Anda dapat menekan menu "DAFTAR NILAI AKADEMIK > Hitung Ulang Nilai" kapan saja.');
}
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setIsCopied(true);
    showToast('Kode Google Apps Script berhasil disalin!');
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Listen for OAuth message from pop-up window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const receivedTokens = event.data.tokens;
        setTokens(receivedTokens);
        localStorage.setItem('google_sheets_tokens', JSON.stringify(receivedTokens));
        setIsAuthenticating(false);
        showToast('Berhasil terhubung dengan Akun Google!');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [showToast]);

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    try {
      setIsAuthenticating(true);
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      if (data.success && data.url) {
        const width = 500;
        const height = 650;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        window.open(data.url, 'GoogleAuth', `width=${width},height=${height},top=${top},left=${left}`);
      } else {
        alert('Gagal mendapatkan URL Autentikasi Google: ' + (data.error || 'Terjadi kesalahan.'));
        setIsAuthenticating(false);
      }
    } catch (err: any) {
      alert('Gagal menghubungi server untuk Otorisasi Google.');
      setIsAuthenticating(false);
    }
  };

  const handleDisconnectGoogle = () => {
    if (confirm('Apakah Anda yakin ingin melepaskan tautan Akun Google?')) {
      setTokens(null);
      localStorage.removeItem('google_sheets_tokens');
      showToast('Tautan Akun Google dilepaskan.');
    }
  };

  const handleSyncToSheets = async () => {
    if (!tokens) {
      alert('Silakan hubungkan Akun Google terlebih dahulu.');
      return;
    }

    try {
      setIsSyncing(true);
      const res = await fetch('/api/sheets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens,
          classInfo: info,
          weights,
          students,
          spreadsheetId
        })
      });

      const data = await res.json();
      if (data.success) {
        setSpreadsheetId(data.spreadsheetId);
        setSpreadsheetUrl(data.spreadsheetUrl);
        setLastSyncedAt(data.syncedAt);

        localStorage.setItem('google_spreadsheet_id', data.spreadsheetId);
        localStorage.setItem('google_spreadsheet_url', data.spreadsheetUrl);
        localStorage.setItem('google_sheets_last_sync', data.syncedAt);

        showToast('Berhasil disinkronkan ke Google Sheets!');
      } else {
        alert('Gagal sinkronisasi: ' + (data.error || 'Terjadi kesalahan.'));
      }
    } catch (err: any) {
      alert('Terjadi kesalahan saat menghubungkan ke Google Sheets.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFromSheets = async () => {
    if (!tokens) {
      alert('Silakan hubungkan Akun Google terlebih dahulu.');
      return;
    }

    const targetId = customSpreadsheetInput.trim() || spreadsheetId;
    if (!targetId) {
      alert('Silakan masukkan ID Spreadsheet atau sinkronkan data terlebih dahulu.');
      return;
    }

    // Extract ID if full URL pasted
    let cleanId = targetId;
    if (targetId.includes('/d/')) {
      const match = targetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) cleanId = match[1];
    }

    try {
      setIsImporting(true);
      const res = await fetch('/api/sheets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens,
          spreadsheetId: cleanId
        })
      });

      const data = await res.json();
      if (data.success && data.students) {
        onImportStudents(data.students);
        setSpreadsheetId(cleanId);
        setSpreadsheetUrl(`https://docs.google.com/spreadsheets/d/${cleanId}/edit`);
        localStorage.setItem('google_spreadsheet_id', cleanId);
        localStorage.setItem('google_spreadsheet_url', `https://docs.google.com/spreadsheets/d/${cleanId}/edit`);

        showToast(`Berhasil mengimpor ${data.students.length} data siswa dari Google Sheets!`);
        onClose();
      } else {
        alert('Gagal mengimpor data: ' + (data.error || 'Format tidak sesuai.'));
      }
    } catch (err: any) {
      alert('Terjadi kesalahan saat mengimpor data dari Google Sheets.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Integrasi & Sinkronisasi Google Sheets
              </h3>
              <p className="text-xs text-emerald-100">Hubungkan daftar nilai langsung ke akun Google Drive / Sheets Anda.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">

          {/* Connection Status Box */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${tokens ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {tokens ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Status Akun Google: {tokens ? <span className="text-emerald-600">Terhubung</span> : <span className="text-amber-600">Belum Terhubung</span>}
                </p>
                <p className="text-[11px] text-slate-500">
                  {tokens ? 'Siap melakukan sinkronisasi otomatis' : 'Otorisasikan akun untuk menyimpan nilai ke Drive'}
                </p>
              </div>
            </div>

            {tokens ? (
              <button
                onClick={handleDisconnectGoogle}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer"
              >
                Putuskan Tautan
              </button>
            ) : (
              <button
                onClick={handleConnectGoogle}
                disabled={isAuthenticating}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 justify-center cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isAuthenticating ? 'Menghubungkan...' : 'Hubungkan Google'}</span>
              </button>
            )}
          </div>

          {/* Sync Action Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Ekspor & Sinkronisasi Ke Google Sheets</span>
            </h4>

            <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Mata Pelajaran: {info.subjectName}</p>
                  <p className="text-[11px] text-slate-600">Kelas: {info.className} • {students.length} Siswa Terdaftar</p>
                </div>

                <button
                  onClick={handleSyncToSheets}
                  disabled={!tokens || isSyncing}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : spreadsheetId ? 'Perbarui Google Sheet' : 'Buat Google Sheet Baru'}</span>
                </button>
              </div>

              {spreadsheetUrl && (
                <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Terhubung ke Spreadsheet</span>
                  </div>
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold underline"
                  >
                    <span>Buka di Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {lastSyncedAt && (
                <p className="text-[10px] text-slate-500 text-right">
                  Terakhir disinkronkan: {new Date(lastSyncedAt).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <DownloadCloud className="w-4 h-4 text-sky-600" />
              <span>Impor Data dari Google Sheets</span>
            </h4>

            <p className="text-xs text-slate-600">
              Tarik data nilai terbaru dari Google Sheets yang ada langsung ke tabel sistem.
            </p>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ID Spreadsheet atau URL Google Sheet..."
                  value={customSpreadsheetInput}
                  onChange={(e) => setCustomSpreadsheetInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                onClick={handleImportFromSheets}
                disabled={!tokens || isImporting}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <DownloadCloud className={`w-4 h-4 ${isImporting ? 'animate-bounce' : ''}`} />
                <span>{isImporting ? 'Mengimpor...' : 'Impor'}</span>
              </button>
            </div>
          </div>

          {/* Apps Script Automation Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-purple-600" />
                <span>Kode Google Apps Script (Otomatisasi Sheets)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAppsScript(!showAppsScript)}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
              >
                <span>{showAppsScript ? 'Sembunyikan Kode' : 'Tampilkan Kode & Cara Pakai'}</span>
                {showAppsScript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Gunakan script ini di menu Extensions Google Sheets untuk menambahkan kalkulasi otomatis & menu kustom di Google Sheets Anda.
            </p>

            {showAppsScript && (
              <div className="mt-3 space-y-3 animate-in fade-in duration-200">
                {/* Step Guide */}
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-900 space-y-1.5">
                  <p className="font-bold text-purple-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Petunjuk Pemasangan Google Apps Script:</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                    <li>Buka spreadsheet Anda di Google Sheets.</li>
                    <li>Klik menu <strong>Extensions (Ekstensi) &gt; Apps Script</strong>.</li>
                    <li>Hapus semua kode bawaan, lalu <strong>Tempel (Paste)</strong> kode di bawah ini.</li>
                    <li>Klik tombol <strong>Simpan (Ctrl + S)</strong> lalu buka kembali Google Sheets Anda.</li>
                    <li>Menu khusus <strong>🎓 DAFTAR NILAI AKADEMIK</strong> akan muncul secara otomatis!</li>
                  </ol>
                </div>

                {/* Code Box with Copy Header */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-md">
                  <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-mono font-bold text-slate-200">Code.gs</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Tersalin!' : 'Salin Kode Script'}</span>
                    </button>
                  </div>

                  <pre className="p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 leading-relaxed scrollbar-thin">
                    {appsScriptCode}
                  </pre>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
