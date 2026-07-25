import React, { useState, useEffect } from 'react';
import { X, Sparkles, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CalculatedGrade, ClassSubjectInfo } from '../types';

interface StudentAiModalProps {
  student: CalculatedGrade | null;
  info: ClassSubjectInfo;
  onClose: () => void;
}

export const StudentAiModal: React.FC<StudentAiModalProps> = ({
  student,
  info,
  onClose
}) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!student) return;

    const fetchStudentAi = async () => {
      setIsLoading(true);
      setAnalysis(null);

      try {
        const res = await fetch('/api/ai/analyze-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: student.nama,
            subjectName: info.subjectName,
            nilaiTugas: student.nilaiTugas,
            nilaiTP: student.nilaiTP,
            nilaiFormatif: student.nilaiFormatif,
            nilaiSumatif: student.nilaiSumatif,
            nilaiSikap: student.nilaiSikap,
            nilaiKehadiran: student.nilaiKehadiran,
            rataRata: student.rataRataAkhir,
            status: student.status,
            kkm: info.kkm
          })
        });

        const data = await res.json();
        if (data.success && data.analysis) {
          setAnalysis(data.analysis);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentAi();
  }, [student, info]);

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Analisis Performa Siswa AI</h3>
              <p className="text-[11px] text-slate-500">{student.nama} ({student.nis || 'NIS -'})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Breakdown Summary */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block">Tugas</span>
            <strong className="text-slate-800">{student.nilaiTugas ?? '-'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">TP</span>
            <strong className="text-slate-800">{student.nilaiTP ?? '-'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Formatif</span>
            <strong className="text-slate-800">{student.nilaiFormatif ?? '-'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Sumatif</span>
            <strong className="text-slate-800">{student.nilaiSumatif ?? '-'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-purple-600 block font-semibold">Sikap</span>
            <strong className="text-purple-900">{student.nilaiSikap ?? '-'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-indigo-600 block font-semibold">Kehadiran</span>
            <strong className="text-indigo-900">{student.nilaiKehadiran ?? '-'}</strong>
          </div>
        </div>

        {/* AI Output Content */}
        <div className="mt-4">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-medium">Gemini AI sedang menganalisis capaian belajar {student.nama}...</p>
            </div>
          ) : analysis ? (
            <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 text-xs text-purple-950 leading-relaxed whitespace-pre-line space-y-2">
              {analysis}
            </div>
          ) : (
            <p className="text-xs text-rose-600 text-center py-6">Gagal menghasilkan analisis AI.</p>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
