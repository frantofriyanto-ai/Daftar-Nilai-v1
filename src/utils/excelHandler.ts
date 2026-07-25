import * as XLSX from 'xlsx';
import { StudentGrade, CalculatedGrade, ClassSubjectInfo, GradeWeighting } from '../types';

export function exportToExcel(
  students: CalculatedGrade[],
  info: ClassSubjectInfo,
  weights: GradeWeighting
) {
  // Create worksheet data with header metadata and grade table
  const wsData: any[][] = [];

  // Header Titles
  wsData.push(['LAPORAN DAFTAR NILAI SISWA & REKAPITULASI AKHIR']);
  wsData.push([`Sekolah: ${info.schoolName}`, '', '', `Mata Pelajaran: ${info.subjectName}`]);
  wsData.push([`Kelas: ${info.className}`, '', '', `Semester / TA: ${info.semester} - ${info.academicYear}`]);
  wsData.push([`Guru Pengampu: ${info.teacherName}`, '', '', `KKM / KKTP: ${info.kkm}`]);
  wsData.push([
    `Bobot Nilai: Tugas (${weights.tugas}%), TP (${weights.tp}%), Formatif (${weights.formatif}%), Sumatif (${weights.sumatif}%), Sikap (${weights.sikap ?? 0}%), Kehadiran (${weights.kehadiran ?? 0}%)`
  ]);
  wsData.push([]); // Empty spacing row

  // Table Columns Header
  const headers = [
    'No',
    'NIS/NISN',
    'Nama Siswa',
    'No. Telp Ortu',
    'Nilai Tugas',
    'TP 1',
    'TP 2',
    'TP 3',
    'TP 4',
    'TP 5',
    'Rata-Rata TP',
    'Nilai Formatif',
    'Nilai Sumatif',
    'Nilai Sikap',
    'Nilai Kehadiran',
    'Rata-Rata Akhir',
    'Predikat',
    'Status',
    'Catatan / Keterangan'
  ];
  wsData.push(headers);

  const startRowIndex = 8; // Row in Excel (1-based index = 8)

  const wSikap = weights.sikap ?? 0;
  const wKehadiran = weights.kehadiran ?? 0;
  const totalW = weights.tugas + weights.tp + weights.formatif + weights.sumatif + wSikap + wKehadiran;

  students.forEach((student, idx) => {
    const excelRow = startRowIndex + idx;
    
    // Columns mapping:
    // E = Tugas, F = TP1, G = TP2, H = TP3, I = TP4, J = TP5, K = Rata TP, L = Formatif, M = Sumatif, N = Sikap, O = Kehadiran, P = Rata Akhir, Q = Predikat, R = Status
    const formulaTPAvg = `=IF(COUNT(F${excelRow}:J${excelRow})>0, ROUND(AVERAGE(F${excelRow}:J${excelRow}), 2), IF(ISBLANK(K${excelRow}), "", K${excelRow}))`;
    const formulaAverage = `=ROUND((E${excelRow}*${weights.tugas} + K${excelRow}*${weights.tp} + L${excelRow}*${weights.formatif} + M${excelRow}*${weights.sumatif} + N${excelRow}*${wSikap} + O${excelRow}*${wKehadiran}) / ${totalW || 100}, 2)`;
    const formulaPredikat = `=IF(ISBLANK(P${excelRow}), "-", IF(P${excelRow}>=90, "A", IF(P${excelRow}>=80, "B", IF(P${excelRow}>=70, "C", "D"))))`;
    const formulaStatus = `=IF(OR(ISBLANK(E${excelRow}), ISBLANK(K${excelRow}), ISBLANK(L${excelRow}), ISBLANK(M${excelRow})), "Belum Lengkap", IF(P${excelRow}>=${info.kkm}, "Tuntas", "Belum Tuntas"))`;

    wsData.push([
      idx + 1,
      student.nis || '-',
      student.nama,
      student.teleponOrtu || '-',
      student.nilaiTugas !== null ? student.nilaiTugas : '',
      student.nilaiTP1 !== null && student.nilaiTP1 !== undefined ? student.nilaiTP1 : '',
      student.nilaiTP2 !== null && student.nilaiTP2 !== undefined ? student.nilaiTP2 : '',
      student.nilaiTP3 !== null && student.nilaiTP3 !== undefined ? student.nilaiTP3 : '',
      student.nilaiTP4 !== null && student.nilaiTP4 !== undefined ? student.nilaiTP4 : '',
      student.nilaiTP5 !== null && student.nilaiTP5 !== undefined ? student.nilaiTP5 : '',
      student.nilaiTP !== null ? student.nilaiTP : { f: formulaTPAvg },
      student.nilaiFormatif !== null ? student.nilaiFormatif : '',
      student.nilaiSumatif !== null ? student.nilaiSumatif : '',
      student.nilaiSikap !== null && student.nilaiSikap !== undefined ? student.nilaiSikap : '',
      student.nilaiKehadiran !== null && student.nilaiKehadiran !== undefined ? student.nilaiKehadiran : '',
      { f: formulaAverage, v: student.rataRataAkhir ?? 0 },
      { f: formulaPredikat, v: student.predikat },
      { f: formulaStatus, v: student.status },
      student.catatan || ''
    ]);
  });

  const lastStudentRow = startRowIndex + students.length - 1;

  // Add Summary Rows with formulas
  if (students.length > 0) {
    wsData.push([]); // blank line
    wsData.push(['', '', 'RATA-RATA KELAS', '', '', '', '', '', '', '', '', '', '', '', '', { f: `=ROUND(AVERAGE(P${startRowIndex}:P${lastStudentRow}), 2)` }, '', '', '']);
    wsData.push(['', '', 'NILAI TERTINGGI', '', '', '', '', '', '', '', '', '', '', '', '', { f: `=MAX(P${startRowIndex}:P${lastStudentRow})` }, '', '', '']);
    wsData.push(['', '', 'NILAI TERENDAH', '', '', '', '', '', '', '', '', '', '', '', '', { f: `=MIN(P${startRowIndex}:P${lastStudentRow})` }, '', '', '']);
    wsData.push(['', '', 'JUMLAH SISWA TUNTAS', '', '', '', '', '', '', '', '', '', '', '', '', { f: `=COUNTIF(R${startRowIndex}:R${lastStudentRow}, "Tuntas")` }, '', '', '']);
    wsData.push(['', '', 'JUMLAH BELUM TUNTAS (REMEDIAL)', '', '', '', '', '', '', '', '', '', '', '', '', { f: `=COUNTIF(R${startRowIndex}:R${lastStudentRow}, "Belum Tuntas")` }, '', '', '']);
  }

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NIS
    { wch: 26 }, // Nama
    { wch: 16 }, // Telp
    { wch: 11 }, // Tugas
    { wch: 8 },  // TP 1
    { wch: 8 },  // TP 2
    { wch: 8 },  // TP 3
    { wch: 8 },  // TP 4
    { wch: 8 },  // TP 5
    { wch: 12 }, // Rata TP
    { wch: 13 }, // Formatif
    { wch: 13 }, // Sumatif
    { wch: 12 }, // Sikap
    { wch: 14 }, // Kehadiran
    { wch: 15 }, // Rata Akhir
    { wch: 10 }, // Predikat
    { wch: 18 }, // Status
    { wch: 25 }  // Catatan
  ];

  // Merge header title
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
    { s: { r: 1, c: 3 }, e: { r: 1, c: 5 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
    { s: { r: 2, c: 3 }, e: { r: 2, c: 5 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
    { s: { r: 3, c: 3 }, e: { r: 3, c: 5 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 11 } }
  ];

  // Create workbook and download
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Nilai');

  const fileName = `Daftar_Nilai_${info.className.replace(/\s+/g, '_')}_${info.subjectName.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function downloadTemplateExcel() {
  const wsData = [
    ['TEMPLATE FORMAT DAFTAR NILAI SISWA (JANGAN UBAH HEADER NAMA KOLOM BARIS KE-5)'],
    ['Petunjuk: Isi data siswa di bawah header. Nilai berkisar 0 - 100.'],
    [''],
    [''],
    ['NIS', 'Nama Siswa', 'No Telp Ortu', 'Email', 'Nilai Tugas', 'TP 1', 'TP 2', 'TP 3', 'TP 4', 'TP 5', 'Nilai Formatif', 'Nilai Sumatif', 'Nilai Sikap', 'Nilai Kehadiran', 'Catatan'],
    ['1001', 'Ahmad Rizky', '081234567890', 'rizky@example.com', 85, 80, 85, 82, 88, 84, 88, 82, 90, 95, 'Siswa aktif'],
    ['1002', 'Budi Santoso', '081298765432', 'budi@example.com', 70, 65, 70, 68, 72, 70, 72, 68, 85, 90, 'Perlu latihan lagi'],
    ['1003', 'Citra Dewi', '081311223344', 'citra@example.com', 90, 92, 90, 95, 94, 92, 95, 90, 95, 100, 'Sangat baik']
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 16 },
    { wch: 22 },
    { wch: 12 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 25 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Nilai');
  XLSX.writeFile(wb, 'Template_Daftar_Nilai_Siswa.xlsx');
}

export function parseExcelFile(file: File): Promise<StudentGrade[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Find header row containing "Nama" or "Nama Siswa"
        let headerRowIdx = -1;
        for (let i = 0; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (Array.isArray(row)) {
            const strRow = row.map(cell => String(cell || '').toLowerCase());
            if (strRow.some(cell => cell.includes('nama'))) {
              headerRowIdx = i;
              break;
            }
          }
        }

        if (headerRowIdx === -1) {
          headerRowIdx = 0; // fallback
        }

        const headers = (jsonRows[headerRowIdx] || []).map((h: any) => String(h || '').trim().toLowerCase());

        // Find indexes
        const idxNIS = headers.findIndex((h: string) => h.includes('nis'));
        const idxNama = headers.findIndex((h: string) => h.includes('nama'));
        const idxTelp = headers.findIndex((h: string) => h.includes('telp') || h.includes('hp') || h.includes('wa') || h.includes('phone'));
        const idxEmail = headers.findIndex((h: string) => h.includes('email'));
        const idxTugas = headers.findIndex((h: string) => h.includes('tugas'));

        // TP 1 to TP 5
        const idxTP1 = headers.findIndex((h: string) => h.includes('tp 1') || h === 'tp1' || h.includes('tp.1') || h.includes('tp_1'));
        const idxTP2 = headers.findIndex((h: string) => h.includes('tp 2') || h === 'tp2' || h.includes('tp.2') || h.includes('tp_2'));
        const idxTP3 = headers.findIndex((h: string) => h.includes('tp 3') || h === 'tp3' || h.includes('tp.3') || h.includes('tp_3'));
        const idxTP4 = headers.findIndex((h: string) => h.includes('tp 4') || h === 'tp4' || h.includes('tp.4') || h.includes('tp_4'));
        const idxTP5 = headers.findIndex((h: string) => h.includes('tp 5') || h === 'tp5' || h.includes('tp.5') || h.includes('tp_5'));

        const idxTP = headers.findIndex((h: string) => (h.includes('tp') || h.includes('tujuan')) && !h.includes('tp 1') && !h.includes('tp 2') && !h.includes('tp 3') && !h.includes('tp 4') && !h.includes('tp 5'));
        const idxFormatif = headers.findIndex((h: string) => h.includes('formatif'));
        const idxSumatif = headers.findIndex((h: string) => h.includes('sumatif'));
        const idxSikap = headers.findIndex((h: string) => h.includes('sikap') || h.includes('karakter'));
        const idxKehadiran = headers.findIndex((h: string) => h.includes('kehadiran') || h.includes('absen') || h.includes('presensi'));
        const idxCatatan = headers.findIndex((h: string) => h.includes('catatan') || h.includes('keterangan'));

        const parsedStudents: StudentGrade[] = [];

        for (let i = headerRowIdx + 1; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || row.length === 0) continue;

          const namaVal = idxNama !== -1 ? row[idxNama] : row[1] || row[0];
          if (!namaVal || String(namaVal).trim() === '') continue; // skip blank rows

          const parseNum = (val: any): number | null => {
            if (val === undefined || val === null || val === '') return null;
            const n = parseFloat(String(val).replace(',', '.'));
            return isNaN(n) ? null : n;
          };

          const tp1 = parseNum(idxTP1 !== -1 ? row[idxTP1] : null);
          const tp2 = parseNum(idxTP2 !== -1 ? row[idxTP2] : null);
          const tp3 = parseNum(idxTP3 !== -1 ? row[idxTP3] : null);
          const tp4 = parseNum(idxTP4 !== -1 ? row[idxTP4] : null);
          const tp5 = parseNum(idxTP5 !== -1 ? row[idxTP5] : null);

          // Compute average of TP 1-5 if available
          const validTPs = [tp1, tp2, tp3, tp4, tp5].filter((v): v is number => v !== null);
          let avgTP = validTPs.length > 0
            ? Math.round((validTPs.reduce((a, b) => a + b, 0) / validTPs.length) * 100) / 100
            : parseNum(idxTP !== -1 ? row[idxTP] : null);

          parsedStudents.push({
            id: 'stu-' + Math.random().toString(36).substring(2, 9),
            nis: idxNIS !== -1 && row[idxNIS] ? String(row[idxNIS]) : '',
            nama: String(namaVal).trim(),
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

        resolve(parsedStudents);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
