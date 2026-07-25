import React from 'react';
import { Settings, Save, Sliders, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { GradeWeighting, ClassSubjectInfo } from '../types';

interface SettingsViewProps {
  weights: GradeWeighting;
  info: ClassSubjectInfo;
  onUpdateWeights: (newWeights: GradeWeighting) => void;
  onUpdateInfo: (newInfo: ClassSubjectInfo) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  weights,
  info,
  onUpdateWeights,
  onUpdateInfo
}) => {
  const totalWeight = weights.tugas + weights.tp + weights.formatif + weights.sumatif + (weights.sikap ?? 0) + (weights.kehadiran ?? 0);
  const isWeightValid = totalWeight === 100;

  const handleWeightChange = (key: keyof GradeWeighting, valStr: string) => {
    const val = parseInt(valStr, 10) || 0;
    onUpdateWeights({ ...weights, [key]: val });
  };

  const handleInfoChange = (key: keyof ClassSubjectInfo, val: any) => {
    onUpdateInfo({ ...info, [key]: val });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Pengaturan Bobot Penilaian & Informasi Kelas</h2>
            <p className="text-xs text-slate-500">Sesuaikan persentase bobot nilai & data sekolah untuk laporan Excel.</p>
          </div>
        </div>
      </div>

      {/* Weighting Config Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>Bobot Kalkulasi Rata-Rata Akhir (%)</span>
          </h3>

          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            isWeightValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {isWeightValid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>Total Bobot: {totalWeight}% {isWeightValid ? '(Valid)' : '(Harus 100%)'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1">Tugas (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={weights.tugas}
              onChange={(e) => handleWeightChange('tugas', e.target.value)}
              className="w-full text-base font-bold text-slate-800 p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 text-center"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1">Rata TP (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={weights.tp}
              onChange={(e) => handleWeightChange('tp', e.target.value)}
              className="w-full text-base font-bold text-slate-800 p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 text-center"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1">Formatif (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={weights.formatif}
              onChange={(e) => handleWeightChange('formatif', e.target.value)}
              className="w-full text-base font-bold text-slate-800 p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 text-center"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1">Sumatif (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={weights.sumatif}
              onChange={(e) => handleWeightChange('sumatif', e.target.value)}
              className="w-full text-base font-bold text-slate-800 p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 text-center"
            />
          </div>

          <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200">
            <label className="block text-xs font-bold text-purple-900 mb-1">Sikap (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={weights.sikap ?? 0}
              onChange={(e) => handleWeightChange('sikap', e.target.value)}
              className="w-full text-base font-bold text-purple-950 p-2 border border-purple-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 text-center"
            />
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200">
            <label className="block text-xs font-bold text-indigo-900 mb-1">Kehadiran (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={weights.kehadiran ?? 0}
              onChange={(e) => handleWeightChange('kehadiran', e.target.value)}
              className="w-full text-base font-bold text-indigo-950 p-2 border border-indigo-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-center"
            />
          </div>

        </div>

        <p className="text-xs text-slate-500 italic">
          Formula Ekspor Excel otomatis mengadopsi persentase bobot di atas secara langsung ke rumus Excel (`ROUND(...)`).
        </p>
      </div>

      {/* Class & School Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-sky-600" />
          <span>Informasi Sekolah & KKM/KKTP</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
          
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Sekolah:</label>
            <input
              type="text"
              value={info.schoolName}
              onChange={(e) => handleInfoChange('schoolName', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Mata Pelajaran:</label>
            <input
              type="text"
              value={info.subjectName}
              onChange={(e) => handleInfoChange('subjectName', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Kelas:</label>
            <input
              type="text"
              value={info.className}
              onChange={(e) => handleInfoChange('className', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Guru Pengampu:</label>
            <input
              type="text"
              value={info.teacherName}
              onChange={(e) => handleInfoChange('teacherName', e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">KKM / KKTP Ketuntasan:</label>
            <input
              type="number"
              min={0}
              max={100}
              value={info.kkm}
              onChange={(e) => handleInfoChange('kkm', parseInt(e.target.value, 10) || 75)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-emerald-700 bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Semester / Tahun Ajaran:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={info.semester}
                onChange={(e) => handleInfoChange('semester', e.target.value)}
                placeholder="Semester"
                className="w-1/2 p-2.5 border border-slate-300 rounded-xl bg-white"
              />
              <input
                type="text"
                value={info.academicYear}
                onChange={(e) => handleInfoChange('academicYear', e.target.value)}
                placeholder="TA"
                className="w-1/2 p-2.5 border border-slate-300 rounded-xl bg-white"
              />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
