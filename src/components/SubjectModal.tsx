import React, { useState } from 'react';
import { BookOpen, X, Check, Plus, Edit2, Sparkles, Building, Award } from 'lucide-react';
import { ClassSubjectInfo } from '../types';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  info: ClassSubjectInfo;
  onUpdateInfo: (newInfo: ClassSubjectInfo) => void;
  showToast: (msg: string) => void;
}

const PRESET_SUBJECTS = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'IPA (Ilmu Pengetahuan Alam)',
  'IPS (Ilmu Pengetahuan Sosial)',
  'Pendidikan Pancasila / PKn',
  'Informatika / TIK',
  'PJOK (Pendidikan Jasmani & Kesehatan)',
  'Seni Budaya & Prakarya',
  'Pendidikan Agama & Budi Pekerti',
  'Sejarah Indonesia',
  'Bimbingan Konseling (BK)'
];

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  info,
  onUpdateInfo,
  showToast
}) => {
  const [subjectName, setSubjectName] = useState(info.subjectName);
  const [className, setClassName] = useState(info.className);
  const [teacherName, setTeacherName] = useState(info.teacherName);
  const [kkm, setKkm] = useState<number>(info.kkm);
  const [schoolName, setSchoolName] = useState(info.schoolName);
  const [semester, setSemester] = useState(info.semester);
  const [academicYear, setAcademicYear] = useState(info.academicYear);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: string) => {
    setSubjectName(preset);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      alert('Nama Mata Pelajaran tidak boleh kosong.');
      return;
    }

    onUpdateInfo({
      ...info,
      subjectName: subjectName.trim(),
      className: className.trim(),
      teacherName: teacherName.trim(),
      kkm,
      schoolName: schoolName.trim(),
      semester: semester.trim(),
      academicYear: academicYear.trim()
    });

    showToast(`Mata pelajaran diperbarui ke ${subjectName.trim()}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Edit & Pilih Mata Pelajaran
              </h3>
              <p className="text-xs text-slate-400">Atur mata pelajaran, KKM, dan data kelas pengampuan Anda.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Quick Preset Subject Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Cepat Mata Pelajaran Populer:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-2xl">
              {PRESET_SUBJECTS.map((subj) => {
                const isSelected = subjectName === subj;
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => handleSelectPreset(subj)}
                    className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Mata Pelajaran:
              </label>
              <input
                type="text"
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Misal: Matematika Wajib, Fisika, Biologi..."
                className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kelas:
                </label>
                <input
                  type="text"
                  required
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="X IPA 1"
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  KKM / KKTP:
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={kkm}
                  onChange={(e) => setKkm(parseInt(e.target.value, 10) || 75)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold text-emerald-700 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Guru Pengampu:
              </label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Sekolah:
              </label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
