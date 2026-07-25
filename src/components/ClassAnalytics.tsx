import React, { useState } from 'react';
import { 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  PieChart, 
  BookOpen 
} from 'lucide-react';
import { CalculatedGrade, ClassSubjectInfo, ClassSummaryStats, GradeWeighting } from '../types';
import { calculateClassSummary } from '../utils/gradeCalculations';

interface ClassAnalyticsProps {
  students: CalculatedGrade[];
  info: ClassSubjectInfo;
  weights: GradeWeighting;
}

export const ClassAnalytics: React.FC<ClassAnalyticsProps> = ({
  students,
  info,
  weights
}) => {
  const summary: ClassSummaryStats = calculateClassSummary(students);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Grade distributions count
  const countA = students.filter(s => s.predikat === 'A').length;
  const countB = students.filter(s => s.predikat === 'B').length;
  const countC = students.filter(s => s.predikat === 'C').length;
  const countD = students.filter(s => s.predikat === 'D').length;

  // Average per component
  const calculateComponentAverage = (key: 'nilaiTugas' | 'nilaiTP' | 'nilaiFormatif' | 'nilaiSumatif' | 'nilaiSikap' | 'nilaiKehadiran'): number => {
    const valid = students.map(s => s[key]).filter((v): v is number => v !== null && v !== undefined);
    if (valid.length === 0) return 0;
    const sum = valid.reduce((acc, curr) => acc + curr, 0);
    return Math.round((sum / valid.length) * 10) / 10;
  };

  const avgTugas = calculateComponentAverage('nilaiTugas');
  const avgTP = calculateComponentAverage('nilaiTP');
  const avgFormatif = calculateComponentAverage('nilaiFormatif');
  const avgSumatif = calculateComponentAverage('nilaiSumatif');
  const avgSikap = calculateComponentAverage('nilaiSikap');
  const avgKehadiran = calculateComponentAverage('nilaiKehadiran');

  const passRatePercentage = summary.totalStudents > 0 
    ? Math.round((summary.tuntasCount / summary.totalStudents) * 100) 
    : 0;

  const handleGenerateClassAi = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/analyze-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: info.className,
          subjectName: info.subjectName,
          summaryStats: summary
        })
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pass Rate Gauge */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Persentase Ketuntasan</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{passRatePercentage}%</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary.tuntasCount} dari {summary.totalStudents} siswa mencapai KKM
            </p>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>

        {/* Average Grade */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-Rata Kelas</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{summary.averageClassGrade}</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Target KKM/KKTP: <strong className="text-slate-800">{info.kkm}</strong>
            </p>
          </div>
          <div className="p-3 bg-sky-100 text-sky-700 rounded-2xl">
            <TrendingUp className="w-7 h-7" />
          </div>
        </div>

        {/* Top Grade */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nilai Tertinggi & Terendah</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              <span className="text-emerald-600">{summary.highestGrade}</span>
              <span className="text-slate-300 font-light">/</span>
              <span className="text-rose-600">{summary.lowestGrade}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Rentang Performa Kelas</p>
          </div>
          <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
            <Award className="w-7 h-7" />
          </div>
        </div>

        {/* Remedial Needed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Siswa Remedial</span>
            <div className="text-2xl font-extrabold text-rose-600 mt-1">{summary.remedialCount} Siswa</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary.incompleteCount} siswa nilai belum lengkap
            </p>
          </div>
          <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
            <AlertTriangle className="w-7 h-7" />
          </div>
        </div>

      </div>

      {/* Visual Component Comparison & Distribution Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Component Averages Comparison */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>Rata-Rata Komponen Penilaian</span>
          </h3>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">Nilai Tugas (Bobot {weights.tugas}%)</span>
                <span className="font-bold text-slate-900">{avgTugas}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all rounded-full"
                  style={{ width: `${avgTugas}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">Nilai TP - Tujuan Pembelajaran (Bobot {weights.tp}%)</span>
                <span className="font-bold text-slate-900">{avgTP}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500 transition-all rounded-full"
                  style={{ width: `${avgTP}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">Nilai Formatif (Bobot {weights.formatif}%)</span>
                <span className="font-bold text-slate-900">{avgFormatif}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all rounded-full"
                  style={{ width: `${avgFormatif}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">Nilai Sumatif (Bobot {weights.sumatif}%)</span>
                <span className="font-bold text-slate-900">{avgSumatif}</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all rounded-full"
                  style={{ width: `${avgSumatif}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">Nilai Sikap (Bobot {weights.sikap ?? 0}%)</span>
                <span className="font-bold text-purple-900">{avgSikap}</span>
              </div>
              <div className="w-full h-3 bg-purple-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 transition-all rounded-full"
                  style={{ width: `${avgSikap}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">Nilai Kehadiran (Bobot {weights.kehadiran ?? 0}%)</span>
                <span className="font-bold text-indigo-900">{avgKehadiran}</span>
              </div>
              <div className="w-full h-3 bg-indigo-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all rounded-full"
                  style={{ width: `${avgKehadiran}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Predikat Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-sky-600" />
            <span>Distribusi Predikat Kelas</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-800">Predikat A (90-100)</span>
                <div className="text-xl font-bold text-emerald-700 mt-0.5">{countA} Siswa</div>
              </div>
              <div className="text-xs font-bold text-emerald-600 bg-emerald-200/60 px-2 py-1 rounded-lg">
                {summary.totalStudents ? Math.round((countA / summary.totalStudents) * 100) : 0}%
              </div>
            </div>

            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-sky-800">Predikat B (80-89)</span>
                <div className="text-xl font-bold text-sky-700 mt-0.5">{countB} Siswa</div>
              </div>
              <div className="text-xs font-bold text-sky-600 bg-sky-200/60 px-2 py-1 rounded-lg">
                {summary.totalStudents ? Math.round((countB / summary.totalStudents) * 100) : 0}%
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-800">Predikat C (70-79)</span>
                <div className="text-xl font-bold text-amber-700 mt-0.5">{countC} Siswa</div>
              </div>
              <div className="text-xs font-bold text-amber-600 bg-amber-200/60 px-2 py-1 rounded-lg">
                {summary.totalStudents ? Math.round((countC / summary.totalStudents) * 100) : 0}%
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-800">Predikat D (&lt;70)</span>
                <div className="text-xl font-bold text-rose-700 mt-0.5">{countD} Siswa</div>
              </div>
              <div className="text-xs font-bold text-rose-600 bg-rose-200/60 px-2 py-1 rounded-lg">
                {summary.totalStudents ? Math.round((countD / summary.totalStudents) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AI Class Pedagogy Assistant Section */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-purple-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-purple-500/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-400/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">Analisis & Rekomendasi Pedagogis AI Guru</h3>
              <p className="text-xs text-purple-200">
                Dapatkan rekomendasi metode pengajaran & penanganan remedial berbasis AI Gemini.
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateClassAi}
            disabled={isGeneratingAi}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGeneratingAi ? 'Menganalisis...' : 'Analisis Kelas dengan AI'}</span>
          </button>
        </div>

        {aiAnalysis ? (
          <div className="bg-purple-950/50 p-5 rounded-xl border border-purple-400/20 text-xs text-purple-100 leading-relaxed space-y-3 whitespace-pre-line font-sans">
            {aiAnalysis}
          </div>
        ) : (
          <p className="text-xs text-purple-300 italic text-center py-4">
            Klik tombol di atas untuk menghasilkan analisis performa kelas secara otomatis dari Gemini AI.
          </p>
        )}
      </div>

    </div>
  );
};
