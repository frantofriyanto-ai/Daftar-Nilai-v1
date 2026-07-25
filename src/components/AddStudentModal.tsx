import React, { useState } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { StudentGrade } from '../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (newStudent: StudentGrade) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent
}) => {
  const [nis, setNis] = useState('');
  const [nama, setNama] = useState('');
  const [teleponOrtu, setTeleponOrtu] = useState('');
  const [email, setEmail] = useState('');
  const [nilaiTugas, setNilaiTugas] = useState<string>('');
  const [nilaiTP1, setNilaiTP1] = useState<string>('');
  const [nilaiTP2, setNilaiTP2] = useState<string>('');
  const [nilaiTP3, setNilaiTP3] = useState<string>('');
  const [nilaiTP4, setNilaiTP4] = useState<string>('');
  const [nilaiTP5, setNilaiTP5] = useState<string>('');
  const [nilaiFormatif, setNilaiFormatif] = useState<string>('');
  const [nilaiSumatif, setNilaiSumatif] = useState<string>('');
  const [nilaiSikap, setNilaiSikap] = useState<string>('');
  const [nilaiKehadiran, setNilaiKehadiran] = useState<string>('');
  const [catatan, setCatatan] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama siswa wajib diisi!');
      return;
    }

    const parseNum = (val: string) => {
      if (val.trim() === '') return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    const tp1 = parseNum(nilaiTP1);
    const tp2 = parseNum(nilaiTP2);
    const tp3 = parseNum(nilaiTP3);
    const tp4 = parseNum(nilaiTP4);
    const tp5 = parseNum(nilaiTP5);

    // Calculate TP average if TP 1-5 are provided
    const validTPs = [tp1, tp2, tp3, tp4, tp5].filter((v): v is number => v !== null);
    const avgTP = validTPs.length > 0 
      ? Math.round((validTPs.reduce((a, b) => a + b, 0) / validTPs.length) * 100) / 100 
      : null;

    const newStudent: StudentGrade = {
      id: 'stu-' + Math.random().toString(36).substring(2, 9),
      nis: nis.trim(),
      nama: nama.trim(),
      teleponOrtu: teleponOrtu.trim(),
      email: email.trim(),
      nilaiTugas: parseNum(nilaiTugas),
      nilaiTP1: tp1,
      nilaiTP2: tp2,
      nilaiTP3: tp3,
      nilaiTP4: tp4,
      nilaiTP5: tp5,
      nilaiTP: avgTP,
      nilaiFormatif: parseNum(nilaiFormatif),
      nilaiSumatif: parseNum(nilaiSumatif),
      nilaiSikap: parseNum(nilaiSikap),
      nilaiKehadiran: parseNum(nilaiKehadiran),
      catatan: catatan.trim()
    };

    onAddStudent(newStudent);
    onClose();

    // reset form
    setNis('');
    setNama('');
    setTeleponOrtu('');
    setEmail('');
    setNilaiTugas('');
    setNilaiTP1('');
    setNilaiTP2('');
    setNilaiTP3('');
    setNilaiTP4('');
    setNilaiTP5('');
    setNilaiFormatif('');
    setNilaiSumatif('');
    setNilaiSikap('');
    setNilaiKehadiran('');
    setCatatan('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <span>Tambah Data Siswa Baru</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIS / NISN:</label>
              <input
                type="text"
                placeholder="2026xxxx"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Siswa *:</label>
              <input
                type="text"
                required
                placeholder="Nama Lengkap"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. Telp / WhatsApp Ortu:</label>
              <input
                type="text"
                placeholder="081234567890"
                value={teleponOrtu}
                onChange={(e) => setTeleponOrtu(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email:</label>
              <input
                type="email"
                placeholder="siswa@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-3">
            <p className="font-bold text-slate-800">Nilai Komponen Awalan (Opsional / Boleh Kosong):</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nilai Tugas</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  value={nilaiTugas}
                  onChange={(e) => setNilaiTugas(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-center font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nilai Formatif</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  value={nilaiFormatif}
                  onChange={(e) => setNilaiFormatif(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-center font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nilai Sumatif</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  value={nilaiSumatif}
                  onChange={(e) => setNilaiSumatif(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-center font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-purple-700 mb-1">Nilai Sikap</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  value={nilaiSikap}
                  onChange={(e) => setNilaiSikap(e.target.value)}
                  className="w-full p-2 border border-purple-200 rounded-xl text-center font-bold bg-purple-50/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-indigo-700 mb-1">Nilai Kehadiran</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0-100"
                  value={nilaiKehadiran}
                  onChange={(e) => setNilaiKehadiran(e.target.value)}
                  className="w-full p-2 border border-indigo-200 rounded-xl text-center font-bold bg-indigo-50/50"
                />
              </div>
            </div>

            {/* TP 1 - TP 5 Sub-Section */}
            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
              <span className="block text-[11px] font-bold text-sky-900">Nilai Tujuan Pembelajaran (TP 1 s/d TP 5):</span>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-[10px] text-center font-semibold text-sky-800 mb-1">TP 1</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="-"
                    value={nilaiTP1}
                    onChange={(e) => setNilaiTP1(e.target.value)}
                    className="w-full p-1.5 border border-sky-300 rounded-lg text-center font-bold text-xs bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-center font-semibold text-sky-800 mb-1">TP 2</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="-"
                    value={nilaiTP2}
                    onChange={(e) => setNilaiTP2(e.target.value)}
                    className="w-full p-1.5 border border-sky-300 rounded-lg text-center font-bold text-xs bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-center font-semibold text-sky-800 mb-1">TP 3</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="-"
                    value={nilaiTP3}
                    onChange={(e) => setNilaiTP3(e.target.value)}
                    className="w-full p-1.5 border border-sky-300 rounded-lg text-center font-bold text-xs bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-center font-semibold text-sky-800 mb-1">TP 4</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="-"
                    value={nilaiTP4}
                    onChange={(e) => setNilaiTP4(e.target.value)}
                    className="w-full p-1.5 border border-sky-300 rounded-lg text-center font-bold text-xs bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-center font-semibold text-sky-800 mb-1">TP 5</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="-"
                    value={nilaiTP5}
                    onChange={(e) => setNilaiTP5(e.target.value)}
                    className="w-full p-1.5 border border-sky-300 rounded-lg text-center font-bold text-xs bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catatan Guru:</label>
            <input
              type="text"
              placeholder="Misal: Siswa pindahan, aktif, perlu perhatian..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Siswa</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
