import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GradeTable } from './components/GradeTable';
import { ReminderSystem } from './components/ReminderSystem';
import { ClassAnalytics } from './components/ClassAnalytics';
import { SettingsView } from './components/SettingsView';
import { AddStudentModal } from './components/AddStudentModal';
import { StudentAiModal } from './components/StudentAiModal';
import { SubjectModal } from './components/SubjectModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';

import { StudentGrade, GradeWeighting, ClassSubjectInfo, CalculatedGrade } from './types';
import { initialStudents, initialWeights, initialClassInfo } from './data/initialData';
import { calculateStudentGrade, generateAutomaticReminders } from './utils/gradeCalculations';
import { exportToExcel, downloadTemplateExcel, parseExcelFile } from './utils/excelHandler';

export default function App() {
  const [students, setStudents] = useState<StudentGrade[]>(initialStudents);
  const [weights, setWeights] = useState<GradeWeighting>(initialWeights);
  const [info, setInfo] = useState<ClassSubjectInfo>(initialClassInfo);
  const [activeTab, setActiveTab] = useState<'table' | 'reminders' | 'analytics' | 'settings'>('table');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [selectedAiStudent, setSelectedAiStudent] = useState<CalculatedGrade | null>(null);
  const [selectedStudentForReminder, setSelectedStudentForReminder] = useState<CalculatedGrade | null>(null);

  // File input ref for Excel import
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculate student grades whenever students, weights or kkm change
  const calculatedStudents: CalculatedGrade[] = useMemo(() => {
    return students.map(student => calculateStudentGrade(student, weights, info.kkm));
  }, [students, weights, info.kkm]);

  // Pending automatic reminders count
  const pendingRemindersCount = useMemo(() => {
    return generateAutomaticReminders(calculatedStudents, info.subjectName, info.kkm).length;
  }, [calculatedStudents, info]);

  // Real-Time Auto-Sync to Google Sheets Web App Endpoint
  const [realtimeSyncState, setRealtimeSyncState] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  useEffect(() => {
    const webAppUrl = localStorage.getItem('google_apps_script_url');
    const autoSync = localStorage.getItem('google_sheets_auto_sync') === 'true';

    if (!webAppUrl || !autoSync) {
      setRealtimeSyncState('idle');
      return;
    }

    setRealtimeSyncState('syncing');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/sheets/webhook-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webAppUrl,
            classInfo: info,
            weights,
            students: calculatedStudents
          })
        });
        const data = await res.json();
        if (data.success) {
          setRealtimeSyncState('synced');
          setTimeout(() => setRealtimeSyncState('idle'), 3000);
        } else {
          setRealtimeSyncState('error');
        }
      } catch (err) {
        setRealtimeSyncState('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [calculatedStudents, weights, info]);

  // Handlers
  const handleUpdateGrade = (id: string, field: keyof CalculatedGrade, value: any) => {
    setStudents(prev =>
      prev.map(s => s.id === id ? { ...s, [field]: value } : s)
    );
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
      showToast('Data siswa berhasil dihapus.');
    }
  };

  const handleAddStudent = (newStudent: StudentGrade) => {
    setStudents(prev => [newStudent, ...prev]);
    showToast(`Siswa ${newStudent.nama} berhasil ditambahkan!`);
  };

  const handleExportExcel = () => {
    exportToExcel(calculatedStudents, info, weights);
    showToast('File Excel daftar nilai berhasil diunduh!');
  };

  const handleDownloadTemplate = () => {
    downloadTemplateExcel();
    showToast('Template Excel berhasil diunduh!');
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedStudents = await parseExcelFile(file);
      if (importedStudents.length === 0) {
        alert('Tidak ada data siswa yang valid ditemukan dalam file Excel tersebut.');
        return;
      }
      setStudents(importedStudents);
      showToast(`Berhasil mengimpor ${importedStudents.length} data siswa dari file Excel!`);
    } catch (err: any) {
      alert('Gagal membaca file Excel: ' + (err.message || 'Format file tidak sesuai'));
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 flex flex-col">
      
      {/* Hidden File Input for Excel Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls, .csv"
        onChange={handleImportFileChange}
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <span>✨ {toastMessage}</span>
        </div>
      )}

      {/* Real-Time Google Sheets Auto-Sync Status Indicator */}
      {realtimeSyncState !== 'idle' && (
        <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          {realtimeSyncState === 'syncing' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span>⚡ Menyimpan nilai ke Google Sheets...</span>
            </>
          )}
          {realtimeSyncState === 'synced' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-emerald-300">✅ Tersinkron ke Google Sheets Real-Time!</span>
            </>
          )}
          {realtimeSyncState === 'error' && (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
              <span className="text-rose-300">⚠️ Gagal auto-sync ke Google Sheets</span>
            </>
          )}
        </div>
      )}

      {/* Main Navbar Header */}
      <Navbar
        info={info}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingRemindersCount={pendingRemindersCount}
        onExportExcel={handleExportExcel}
        onDownloadTemplate={handleDownloadTemplate}
        onImportClick={() => fileInputRef.current?.click()}
        onAddStudentClick={() => setIsAddModalOpen(true)}
        onEditSubjectClick={() => setIsSubjectModalOpen(true)}
        onGoogleSheetsClick={() => setIsSheetsModalOpen(true)}
      />

      {/* Body Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'table' && (
          <GradeTable
            students={calculatedStudents}
            weights={weights}
            info={info}
            onUpdateGrade={handleUpdateGrade}
            onDeleteStudent={handleDeleteStudent}
            onOpenAiStudent={(stu) => setSelectedAiStudent(stu)}
            onOpenSendReminder={(stu) => {
              setSelectedStudentForReminder(stu);
              setActiveTab('reminders');
            }}
            onAddStudentClick={() => setIsAddModalOpen(true)}
          />
        )}

        {activeTab === 'reminders' && (
          <ReminderSystem
            students={calculatedStudents}
            info={info}
            selectedStudentForReminder={selectedStudentForReminder}
            onClearSelectedStudent={() => setSelectedStudentForReminder(null)}
          />
        )}

        {activeTab === 'analytics' && (
          <ClassAnalytics
            students={calculatedStudents}
            info={info}
            weights={weights}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            weights={weights}
            info={info}
            onUpdateWeights={setWeights}
            onUpdateInfo={setInfo}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>
          System Format Daftar Nilai Siswa & Pengingat Otomatis • {info.schoolName} ({info.academicYear})
        </p>
      </footer>

      {/* Modals */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStudent={handleAddStudent}
      />

      <StudentAiModal
        student={selectedAiStudent}
        info={info}
        onClose={() => setSelectedAiStudent(null)}
      />

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        info={info}
        onUpdateInfo={setInfo}
        showToast={showToast}
      />

      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        info={info}
        weights={weights}
        students={calculatedStudents}
        onImportStudents={(imported) => setStudents(imported)}
        showToast={showToast}
      />

    </div>
  );
}
