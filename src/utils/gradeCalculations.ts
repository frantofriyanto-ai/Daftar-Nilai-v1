import { StudentGrade, GradeWeighting, CalculatedGrade, ClassSummaryStats, ReminderItem } from '../types';

export function calculateAverageTP(student: StudentGrade): number | null {
  const tpList = [
    student.nilaiTP1,
    student.nilaiTP2,
    student.nilaiTP3,
    student.nilaiTP4,
    student.nilaiTP5
  ].filter((v): v is number => v !== undefined && v !== null && !isNaN(v));

  if (tpList.length > 0) {
    const sum = tpList.reduce((acc, curr) => acc + curr, 0);
    return Math.round((sum / tpList.length) * 100) / 100;
  }
  return student.nilaiTP;
}

export function calculateStudentGrade(
  student: StudentGrade,
  weights: GradeWeighting,
  kkm: number
): CalculatedGrade {
  const computedTP = calculateAverageTP(student);
  const effectiveStudent: StudentGrade = {
    ...student,
    nilaiTP: computedTP
  };

  const { nilaiTugas, nilaiTP, nilaiFormatif, nilaiSumatif, nilaiSikap, nilaiKehadiran } = effectiveStudent;

  const weightSikap = weights.sikap ?? 0;
  const weightKehadiran = weights.kehadiran ?? 0;

  // Check components
  const hasTugas = nilaiTugas !== null && !isNaN(nilaiTugas);
  const hasTP = nilaiTP !== null && !isNaN(nilaiTP);
  const hasFormatif = nilaiFormatif !== null && !isNaN(nilaiFormatif);
  const hasSumatif = nilaiSumatif !== null && !isNaN(nilaiSumatif);
  const hasSikap = weightSikap === 0 || (nilaiSikap !== null && nilaiSikap !== undefined && !isNaN(nilaiSikap));
  const hasKehadiran = weightKehadiran === 0 || (nilaiKehadiran !== null && nilaiKehadiran !== undefined && !isNaN(nilaiKehadiran));

  const isComplete = hasTugas && hasTP && hasFormatif && hasSumatif && hasSikap && hasKehadiran;

  let totalWeight = 0;
  let weightedSum = 0;

  if (hasTugas) { weightedSum += (nilaiTugas! * weights.tugas); totalWeight += weights.tugas; }
  if (hasTP) { weightedSum += (nilaiTP! * weights.tp); totalWeight += weights.tp; }
  if (hasFormatif) { weightedSum += (nilaiFormatif! * weights.formatif); totalWeight += weights.formatif; }
  if (hasSumatif) { weightedSum += (nilaiSumatif! * weights.sumatif); totalWeight += weights.sumatif; }
  if (nilaiSikap !== null && nilaiSikap !== undefined && !isNaN(nilaiSikap) && weightSikap > 0) {
    weightedSum += (nilaiSikap * weightSikap);
    totalWeight += weightSikap;
  }
  if (nilaiKehadiran !== null && nilaiKehadiran !== undefined && !isNaN(nilaiKehadiran) && weightKehadiran > 0) {
    weightedSum += (nilaiKehadiran * weightKehadiran);
    totalWeight += weightKehadiran;
  }

  const rawAvg = totalWeight > 0 ? (weightedSum / totalWeight) : null;
  const finalAvg = rawAvg !== null ? Math.round(rawAvg * 100) / 100 : null;

  if (!isComplete) {
    return {
      ...effectiveStudent,
      rataRataAkhir: finalAvg,
      predikat: getPredikat(finalAvg),
      status: 'Belum Lengkap'
    };
  }

  const isTuntas = (finalAvg ?? 0) >= kkm;

  return {
    ...effectiveStudent,
    rataRataAkhir: finalAvg,
    predikat: getPredikat(finalAvg),
    status: isTuntas ? 'Tuntas' : 'Belum Tuntas (Remedial)'
  };
}

export function getPredikat(score: number | null): 'A' | 'B' | 'C' | 'D' | '-' {
  if (score === null) return '-';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'D';
}

export function calculateClassSummary(students: CalculatedGrade[]): ClassSummaryStats {
  if (students.length === 0) {
    return {
      totalStudents: 0,
      tuntasCount: 0,
      remedialCount: 0,
      incompleteCount: 0,
      averageClassGrade: 0,
      highestGrade: 0,
      lowestGrade: 0
    };
  }

  let tuntasCount = 0;
  let remedialCount = 0;
  let incompleteCount = 0;
  let sumGrades = 0;
  let validGradeCount = 0;
  let highest = -1;
  let lowest = 101;

  students.forEach(s => {
    if (s.status === 'Tuntas') tuntasCount++;
    else if (s.status === 'Belum Tuntas (Remedial)') remedialCount++;
    else incompleteCount++;

    if (s.rataRataAkhir !== null) {
      sumGrades += s.rataRataAkhir;
      validGradeCount++;
      if (s.rataRataAkhir > highest) highest = s.rataRataAkhir;
      if (s.rataRataAkhir < lowest) lowest = s.rataRataAkhir;
    }
  });

  return {
    totalStudents: students.length,
    tuntasCount,
    remedialCount,
    incompleteCount,
    averageClassGrade: validGradeCount > 0 ? Math.round((sumGrades / validGradeCount) * 100) / 100 : 0,
    highestGrade: highest === -1 ? 0 : highest,
    lowestGrade: lowest === 101 ? 0 : lowest
  };
}

export function generateAutomaticReminders(
  students: CalculatedGrade[],
  subjectName: string,
  kkm: number
): ReminderItem[] {
  const reminders: ReminderItem[] = [];
  const today = new Date().toISOString().split('T')[0];

  students.forEach((s) => {
    const missingFields: string[] = [];
    if (s.nilaiTugas === null) missingFields.push('Nilai Tugas');
    if (s.nilaiTP === null) missingFields.push('Nilai TP');
    if (s.nilaiFormatif === null) missingFields.push('Nilai Formatif');
    if (s.nilaiSumatif === null) missingFields.push('Nilai Sumatif');

    if (missingFields.length > 0) {
      reminders.push({
        id: `rem-missing-${s.id}`,
        studentId: s.id,
        studentName: s.nama,
        teleponOrtu: s.teleponOrtu,
        type: 'tugas_kosong',
        title: `Lengkapi Nilai ${missingFields.join(', ')}`,
        message: `Yth. Wali Siswa ${s.nama}, diberitahukan bahwa komponen nilai (${missingFields.join(', ')}) untuk mata pelajaran ${subjectName} masih kosong/belum dikumpulkan. Mohon koordinasikan dengan siswa. Terima kasih.`,
        dueDate: today,
        status: 'pending',
        createdAt: today
      });
    } else if (s.rataRataAkhir !== null && s.rataRataAkhir < kkm) {
      reminders.push({
        id: `rem-remedial-${s.id}`,
        studentId: s.id,
        studentName: s.nama,
        teleponOrtu: s.teleponOrtu,
        type: 'remedial_kkm',
        title: `Pengingat Remedial (${s.rataRataAkhir} < KKM ${kkm})`,
        message: `Yth. Orang Tua/Wali dari ${s.nama}, nilai akhir mata pelajaran ${subjectName} saat ini adalah ${s.rataRataAkhir} (di bawah batas KKM/KKTP ${kkm}). Siswa dijadwalkan mengikuti program perbaikan/remedial. Mohon dukungan dan bimbingannya. Terima kasih.`,
        dueDate: today,
        status: 'pending',
        createdAt: today
      });
    }
  });

  return reminders;
}
