export interface GradeWeighting {
  tugas: number; // e.g. 20 (%)
  tp: number;    // e.g. 20 (%)
  formatif: number; // e.g. 25 (%)
  sumatif: number;  // e.g. 25 (%)
  sikap?: number;   // e.g. 5 (%)
  kehadiran?: number; // e.g. 5 (%)
}

export interface StudentGrade {
  id: string;
  nis: string;
  nama: string;
  teleponOrtu: string;
  email: string;
  nilaiTugas: number | null;
  nilaiTP1?: number | null;
  nilaiTP2?: number | null;
  nilaiTP3?: number | null;
  nilaiTP4?: number | null;
  nilaiTP5?: number | null;
  nilaiTP: number | null; // Overall / Rata-rata Tujuan Pembelajaran
  nilaiFormatif: number | null;
  nilaiSumatif: number | null;
  nilaiSikap?: number | null;
  nilaiKehadiran?: number | null;
  catatan?: string;
  lastReminderSent?: string;
}

export interface ClassSubjectInfo {
  className: string;
  subjectName: string;
  teacherName: string;
  schoolName: string;
  semester: string;
  academicYear: string;
  kkm: number; // KKTP / Minimum Passing Grade (Default: 75)
}

export interface ReminderItem {
  id: string;
  studentId: string;
  studentName: string;
  teleponOrtu: string;
  type: 'tugas_kosong' | 'remedial_kkm' | 'jadwal_remedial' | 'peringatan_kehadiran' | 'custom';
  title: string;
  message: string;
  dueDate: string;
  status: 'pending' | 'sent' | 'dismissed';
  createdAt: string;
}

export interface CalculatedGrade extends StudentGrade {
  rataRataAkhir: number | null;
  predikat: 'A' | 'B' | 'C' | 'D' | '-';
  status: 'Tuntas' | 'Belum Tuntas (Remedial)' | 'Belum Lengkap';
}

export interface ClassSummaryStats {
  totalStudents: number;
  tuntasCount: number;
  remedialCount: number;
  incompleteCount: number;
  averageClassGrade: number;
  highestGrade: number;
  lowestGrade: number;
}
