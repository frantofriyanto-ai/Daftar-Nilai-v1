import React, { useState } from 'react';
import { 
  Search, 
  MessageCircle, 
  Sparkles, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  UserPlus
} from 'lucide-react';
import { CalculatedGrade, GradeWeighting, ClassSubjectInfo } from '../types';

interface GradeTableProps {
  students: CalculatedGrade[];
  weights: GradeWeighting;
  info: ClassSubjectInfo;
  onUpdateGrade: (id: string, field: keyof CalculatedGrade, value: any) => void;
  onDeleteStudent: (id: string) => void;
  onOpenAiStudent: (student: CalculatedGrade) => void;
  onOpenSendReminder: (student: CalculatedGrade) => void;
  onAddStudentClick: () => void;
}

export const GradeTable: React.FC<GradeTableProps> = ({
  students,
  weights,
  info,
  onUpdateGrade,
  onDeleteStudent,
  onOpenAiStudent,
  onOpenSendReminder,
  onAddStudentClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'tuntas' | 'remedial' | 'incomplete'>('all');
  const [sortField, setSortField] = useState<'nama' | 'rataRataAkhir' | 'status'>('nama');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'tuntas') return s.status === 'Tuntas';
    if (filterStatus === 'remedial') return s.status === 'Belum Tuntas (Remedial)';
    if (filterStatus === 'incomplete') return s.status === 'Belum Lengkap';

    return true;
  });

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortField === 'nama') {
      return sortAsc ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama);
    }
    if (sortField === 'rataRataAkhir') {
      const valA = a.rataRataAkhir ?? -1;
      const valB = b.rataRataAkhir ?? -1;
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  const handleSort = (field: 'nama' | 'rataRataAkhir' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleNumberInputChange = (
    id: string,
    field: 'nilaiTugas' | 'nilaiTP1' | 'nilaiTP2' | 'nilaiTP3' | 'nilaiTP4' | 'nilaiTP5' | 'nilaiTP' | 'nilaiFormatif' | 'nilaiSumatif' | 'nilaiSikap' | 'nilaiKehadiran',
    valStr: string
  ) => {
    if (valStr.trim() === '') {
      onUpdateGrade(id, field, null);
      return;
    }
    let num = parseFloat(valStr);
    if (isNaN(num)) return;
    if (num < 0) num = 0;
    if (num > 100) num = 100;
    onUpdateGrade(id, field, num);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({students.length})
            </button>
            <button
              onClick={() => setFilterStatus('tuntas')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'tuntas' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tuntas
            </button>
            <button
              onClick={() => setFilterStatus('remedial')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'remedial' ? 'bg-rose-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Remedial
            </button>
            <button
              onClick={() => setFilterStatus('incomplete')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterStatus === 'incomplete' ? 'bg-amber-500 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belum Lengkap
            </button>
          </div>
        </div>

        {/* Current Weighting Summary Badge */}
        <div className="text-xs text-slate-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="font-semibold text-emerald-800">Bobot Rata-Rata:</span>
          <span>Tugas: <strong>{weights.tugas}%</strong></span> •
          <span>TP: <strong>{weights.tp}%</strong></span> •
          <span>Formatif: <strong>{weights.formatif}%</strong></span> •
          <span>Sumatif: <strong>{weights.sumatif}%</strong></span>
        </div>

      </div>

      {/* Main Excel-style Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <th className="py-3 px-3 text-center w-12 border-r border-slate-200">No</th>
              <th className="py-3 px-3 border-r border-slate-200 min-w-[100px]">NIS</th>
              
              <th 
                onClick={() => handleSort('nama')}
                className="py-3 px-4 border-r border-slate-200 min-w-[200px] cursor-pointer hover:bg-slate-200/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>Nama Siswa</span>
                  {sortField === 'nama' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                </div>
              </th>

              {/* Specific Required Columns from User Prompt */}
              <th className="py-3 px-2 border-r border-slate-200 text-center w-20 bg-emerald-50/50">
                Tugas <span className="block text-[10px] text-emerald-700 font-normal">({weights.tugas}%)</span>
              </th>

              {/* Individual Learning Objectives (TP 1 to TP 5) */}
              <th className="py-3 px-2 border-r border-slate-200 text-center w-16 bg-sky-50/70">
                TP 1
              </th>
              <th className="py-3 px-2 border-r border-slate-200 text-center w-16 bg-sky-50/70">
                TP 2
              </th>
              <th className="py-3 px-2 border-r border-slate-200 text-center w-16 bg-sky-50/70">
                TP 3
              </th>
              <th className="py-3 px-2 border-r border-slate-200 text-center w-16 bg-sky-50/70">
                TP 4
              </th>
              <th className="py-3 px-2 border-r border-slate-200 text-center w-16 bg-sky-50/70">
                TP 5
              </th>

              <th className="py-3 px-2 border-r border-slate-200 text-center w-24 bg-sky-100/80 font-bold">
                Rata TP <span className="block text-[10px] text-sky-800 font-normal">({weights.tp}%)</span>
              </th>

              <th className="py-3 px-2 border-r border-slate-200 text-center w-20 bg-emerald-50/50">
                Formatif <span className="block text-[10px] text-emerald-700 font-normal">({weights.formatif}%)</span>
              </th>
              <th className="py-3 px-2 border-r border-slate-200 text-center w-20 bg-emerald-50/50">
                Sumatif <span className="block text-[10px] text-emerald-700 font-normal">({weights.sumatif}%)</span>
              </th>

              <th className="py-3 px-2 border-r border-slate-200 text-center w-20 bg-purple-50/50">
                Sikap <span className="block text-[10px] text-purple-700 font-normal">({weights.sikap ?? 0}%)</span>
              </th>
              <th className="py-3 px-2 border-r border-slate-200 text-center w-20 bg-indigo-50/50">
                Kehadiran <span className="block text-[10px] text-indigo-700 font-normal">({weights.kehadiran ?? 0}%)</span>
              </th>

              {/* Automatic Formula Average */}
              <th 
                onClick={() => handleSort('rataRataAkhir')}
                className="py-3 px-3 border-r border-slate-200 text-center min-w-[120px] bg-slate-200/70 font-bold cursor-pointer hover:bg-slate-300/60"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Rata Akhir</span>
                  {sortField === 'rataRataAkhir' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                </div>
              </th>

              <th className="py-3 px-2 border-r border-slate-200 text-center w-14">Predikat</th>
              <th className="py-3 px-2 border-r border-slate-200 text-center min-w-[120px]">Status (KKM {info.kkm})</th>
              <th className="py-3 px-3 text-center min-w-[140px]">Aksi & Pengingat</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {sortedStudents.length === 0 ? (
              <tr>
                <td colSpan={18} className="py-12 text-center text-slate-500">
                  <div className="max-w-sm mx-auto space-y-2">
                    <p className="font-semibold text-slate-700 text-sm">Tidak ada siswa ditemukan</p>
                    <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau tambah data siswa baru.</p>
                    <button
                      onClick={onAddStudentClick}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-500 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Tambah Siswa Sekarang</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedStudents.map((student, index) => {
                const isUnderKKM = student.rataRataAkhir !== null && student.rataRataAkhir < info.kkm;
                const isIncomplete = student.status === 'Belum Lengkap';

                return (
                  <tr 
                    key={student.id} 
                    className={`hover:bg-slate-50 transition-colors ${
                      isUnderKKM ? 'bg-rose-50/30' : isIncomplete ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-2 text-center text-slate-500 font-mono border-r border-slate-200">
                      {index + 1}
                    </td>

                    {/* NIS */}
                    <td className="py-3 px-2 font-mono text-slate-600 border-r border-slate-200">
                      <input
                        type="text"
                        value={student.nis}
                        onChange={(e) => onUpdateGrade(student.id, 'nis', e.target.value)}
                        placeholder="NIS"
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white px-1 py-0.5 rounded transition-all focus:outline-none"
                      />
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-3 font-medium text-slate-900 border-r border-slate-200">
                      <input
                        type="text"
                        value={student.nama}
                        onChange={(e) => onUpdateGrade(student.id, 'nama', e.target.value)}
                        className="w-full font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white px-1 py-0.5 rounded transition-all focus:outline-none"
                      />
                      {student.teleponOrtu && (
                        <span className="block text-[11px] text-slate-400 font-normal">
                          📱 {student.teleponOrtu}
                        </span>
                      )}
                    </td>

                    {/* Nilai Tugas */}
                    <td className="py-2 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="-"
                        value={student.nilaiTugas ?? ''}
                        onChange={(e) => handleNumberInputChange(student.id, 'nilaiTugas', e.target.value)}
                        className={`w-full text-center font-semibold py-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          student.nilaiTugas === null
                            ? 'border-amber-300 bg-amber-50/50 text-amber-700 placeholder:text-amber-400'
                            : student.nilaiTugas < info.kkm
                            ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      />
                    </td>

                    {/* TP 1 */}
                    <td className="py-2 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="-"
                        value={student.nilaiTP1 ?? ''}
                        onChange={(e) => handleNumberInputChange(student.id, 'nilaiTP1', e.target.value)}
                        className={`w-full text-center font-semibold py-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          student.nilaiTP1 === null || student.nilaiTP1 === undefined
                            ? 'border-slate-200 bg-slate-50 text-slate-400'
                            : student.nilaiTP1 < info.kkm
                            ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      />
                    </td>

                    {/* TP 2 */}
                    <td className="py-2 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="-"
                        value={student.nilaiTP2 ?? ''}
                        onChange={(e) => handleNumberInputChange(student.id, 'nilaiTP2', e.target.value)}
                        className={`w-full text-center font-semibold py-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          student.nilaiTP2 === null || student.nilaiTP2 === undefined
                            ? 'border-slate-200 bg-slate-50 text-slate-400'
                            : student.nilaiTP2 < info.kkm
                            ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      />
                    </td>

                    {/* TP 3 */}
                    <td className="py-2 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="-"
                        value={student.nilaiTP3 ?? ''}
                        onChange={(e) => handleNumberInputChange(student.id, 'nilaiTP3', e.target.value)}
                        className={`w-full text-center font-semibold py-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          student.nilaiTP3 === null || student.nilaiTP3 === undefined
                            ? 'border-slate-200 bg-slate-50 text-slate-400'
                            : student.nilaiTP3 < info.kkm
                            ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      />
                    </td>

                    {/* TP 4 */}
                    <td className="py-2 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="-"
                        value={student.nilaiTP4 ?? ''}
                        onChange={(e) => handleNumberInputChange(student.id, 'nilaiTP4', e.target.value)}
                        className={`w-full text-center font-semibold py-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          student.nilaiTP4 === null || student.nilaiTP4 === undefined
                            ? 'border-slate-200 bg-slate-50 text-slate-400'
                            : student.nilaiTP4 < info.kkm
                            ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      />
                    </td>

                    {/* TP 5 */}
                    <td className="py-2 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="-"
                        value={student.nilaiTP5 ?? ''}
                        onChange={(e) => handleNumberInputChange(student.id, 'nilaiTP5', e.target.value)}
                        className={`w-full text-center font-semibold py-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                          student.nilaiTP5 === null || student.nilaiTP5 === undefined
                            ? 'border-slate-200 bg-slate-50 text-slate-400'
                            : student.nilaiTP5 < info.kkm
                            ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      />
                    </td>

                    {/* Nilai Rata-Rata TP */}
                    <td className="py-2 px-1 border-r border-slate-200 text-center bg-sky-50/60 font-bold text-sky-900">
                      {student.nilaiTP !== null ? (
                        <span className={student.nilaiTP >= info.kkm ? 'text-sky-800' : 'text-rose-600'}>
                          {student.nilaiTP}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-normal italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Formatif */}
                    <td className="py-2 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="-"
                        value={student.nilaiFormatif ?? ''}
                        onChange={(e) => handleNumberInputChange(student.id, 'nilaiFormatif', e.target.value)}
                        className={`w-full text-center font-semibold py-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          student.nilaiFormatif === null
                            ? 'border-amber-300 bg-amber-50/50 text-amber-700 placeholder:text-amber-400'
                            : student.nilaiFormatif < info.kkm
                            ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      />
                    </td>

                    {/* Sumatif */}
                    <td className="py-2 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="-"
                        value={student.nilaiSumatif ?? ''}
                        onChange={(e) => handleNumberInputChange(student.id, 'nilaiSumatif', e.target.value)}
                        className={`w-full text-center font-semibold py-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          student.nilaiSumatif === null
                            ? 'border-amber-300 bg-amber-50/50 text-amber-700 placeholder:text-amber-400'
                            : student.nilaiSumatif < info.kkm
                            ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      />
                    </td>

                    {/* Sikap */}
                    <td className="py-2 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="-"
                        value={student.nilaiSikap ?? ''}
                        onChange={(e) => handleNumberInputChange(student.id, 'nilaiSikap', e.target.value)}
                        className={`w-full text-center font-semibold py-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          student.nilaiSikap === null || student.nilaiSikap === undefined
                            ? 'border-slate-200 bg-slate-50 text-slate-400'
                            : student.nilaiSikap < info.kkm
                            ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      />
                    </td>

                    {/* Kehadiran */}
                    <td className="py-2 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="-"
                        value={student.nilaiKehadiran ?? ''}
                        onChange={(e) => handleNumberInputChange(student.id, 'nilaiKehadiran', e.target.value)}
                        className={`w-full text-center font-semibold py-1.5 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          student.nilaiKehadiran === null || student.nilaiKehadiran === undefined
                            ? 'border-slate-200 bg-slate-50 text-slate-400'
                            : student.nilaiKehadiran < info.kkm
                            ? 'border-rose-300 bg-rose-50/50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                        }`}
                      />
                    </td>

                    {/* Rata-Rata Akhir Otomatis */}
                    <td className="py-3 px-4 border-r border-slate-200 text-center bg-slate-100/80 font-mono font-bold text-sm">
                      {student.rataRataAkhir !== null ? (
                        <span className={student.rataRataAkhir >= info.kkm ? 'text-emerald-700' : 'text-rose-600'}>
                          {student.rataRataAkhir}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-normal italic text-xs">Belum Lengkap</span>
                      )}
                    </td>

                    {/* Predikat */}
                    <td className="py-3 px-3 border-r border-slate-200 text-center font-bold">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                        student.predikat === 'A' ? 'bg-emerald-100 text-emerald-800' :
                        student.predikat === 'B' ? 'bg-sky-100 text-sky-800' :
                        student.predikat === 'C' ? 'bg-amber-100 text-amber-800' :
                        student.predikat === 'D' ? 'bg-rose-100 text-rose-800' :
                        'text-slate-400'
                      }`}>
                        {student.predikat}
                      </span>
                    </td>

                    {/* Status Tuntas / Remedial / Belum Lengkap */}
                    <td className="py-3 px-3 border-r border-slate-200 text-center">
                      {student.status === 'Tuntas' && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tuntas</span>
                        </span>
                      )}
                      {student.status === 'Belum Tuntas (Remedial)' && (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-semibold px-2.5 py-1 rounded-full text-[11px] border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Remedial</span>
                        </span>
                      )}
                      {student.status === 'Belum Lengkap' && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-medium px-2.5 py-1 rounded-full text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Belum Lengkap</span>
                        </span>
                      )}
                    </td>

                    {/* Actions & Reminder Button */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* Send WA Reminder Button */}
                        <button
                          onClick={() => onOpenSendReminder(student)}
                          title="Kirim Pengingat WhatsApp ke Ortu"
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        {/* AI Student Advisor */}
                        <button
                          onClick={() => onOpenAiStudent(student)}
                          title="Analisis AI & Rekomendasi Remedial"
                          className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        {/* Delete Student */}
                        <button
                          onClick={() => onDeleteStudent(student.id)}
                          title="Hapus Siswa"
                          className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Stats */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div>
          Menampilkan <strong>{sortedStudents.length}</strong> dari <strong>{students.length}</strong> siswa.
        </div>
        <div className="flex items-center gap-4 font-medium">
          <span className="text-emerald-700">
            ✅ Tuntas: <strong>{students.filter(s => s.status === 'Tuntas').length}</strong>
          </span>
          <span className="text-rose-600">
            ⚠️ Remedial: <strong>{students.filter(s => s.status === 'Belum Tuntas (Remedial)').length}</strong>
          </span>
          <span className="text-amber-600">
            ⏳ Belum Lengkap: <strong>{students.filter(s => s.status === 'Belum Lengkap').length}</strong>
          </span>
        </div>
      </div>

    </div>
  );
};
