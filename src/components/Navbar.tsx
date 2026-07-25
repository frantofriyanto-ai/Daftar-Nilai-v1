import React from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  BellRing, 
  GraduationCap, 
  BarChart3, 
  Settings, 
  Plus, 
  BookOpen,
  Edit2,
  Cloud
} from 'lucide-react';
import { ClassSubjectInfo } from '../types';

interface NavbarProps {
  info: ClassSubjectInfo;
  activeTab: 'table' | 'reminders' | 'analytics' | 'settings';
  setActiveTab: (tab: 'table' | 'reminders' | 'analytics' | 'settings') => void;
  pendingRemindersCount: number;
  onExportExcel: () => void;
  onDownloadTemplate: () => void;
  onImportClick: () => void;
  onAddStudentClick: () => void;
  onEditSubjectClick: () => void;
  onGoogleSheetsClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  info,
  activeTab,
  setActiveTab,
  pendingRemindersCount,
  onExportExcel,
  onDownloadTemplate,
  onImportClick,
  onAddStudentClick,
  onEditSubjectClick,
  onGoogleSheetsClick
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
      {/* Top Banner Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Subject Header */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Format Daftar Nilai & Pengingat Excel
                </h1>
                <button
                  onClick={onEditSubjectClick}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Klik untuk ubah Mata Pelajaran & Kelas"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{info.subjectName}</span>
                  <Edit2 className="w-3 h-3 ml-0.5 opacity-75" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>🏫 <strong className="text-slate-200">{info.schoolName}</strong></span>
                <span>•</span>
                <span>📚 <strong className="text-slate-200">{info.subjectName}</strong> ({info.className})</span>
                <span>•</span>
                <span>👤 {info.teacherName}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">KKM: {info.kkm}</span>
              </p>
            </div>
          </div>

          {/* Excel & Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onEditSubjectClick}
              title="Tambah / Ubah Mata Pelajaran & Kelas"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Mapel / Kelas</span>
            </button>

            <button
              onClick={onGoogleSheetsClick}
              title="Sinkronkan nilai langsung ke Google Sheets"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Cloud className="w-4 h-4 text-emerald-200" />
              <span>Google Sheets</span>
            </button>

            <button
              onClick={onAddStudentClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa</span>
            </button>

            <button
              onClick={onExportExcel}
              title="Unduh file Excel berformula otomatis"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              onClick={onImportClick}
              title="Impor file Excel / CSV nilai siswa"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Impor Excel</span>
            </button>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-2 overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-2 min-w-max">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Format Tabel Nilai</span>
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all relative cursor-pointer ${
                activeTab === 'reminders'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BellRing className="w-4 h-4" />
              <span>Sistem Pengingat Otomatis</span>
              {pendingRemindersCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                  {pendingRemindersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analisis & AI Kelas</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan & Bobot</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
