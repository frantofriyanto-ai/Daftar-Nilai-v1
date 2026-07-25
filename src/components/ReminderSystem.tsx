import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  MessageCircle, 
  Send, 
  Copy, 
  Check, 
  Sparkles, 
  FileText, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  RefreshCw,
  Phone,
  Calendar
} from 'lucide-react';
import { CalculatedGrade, ClassSubjectInfo, ReminderItem } from '../types';
import { generateAutomaticReminders } from '../utils/gradeCalculations';

interface ReminderSystemProps {
  students: CalculatedGrade[];
  info: ClassSubjectInfo;
  selectedStudentForReminder: CalculatedGrade | null;
  onClearSelectedStudent: () => void;
}

export const ReminderSystem: React.FC<ReminderSystemProps> = ({
  students,
  info,
  selectedStudentForReminder,
  onClearSelectedStudent
}) => {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'wa' | 'letter'>('alerts');

  // WhatsApp generator state
  const [targetStudent, setTargetStudent] = useState<CalculatedGrade | null>(selectedStudentForReminder || (students[0] || null));
  const [reminderType, setReminderType] = useState<'tugas' | 'remedial' | 'jadwal'>('remedial');
  const [customMessage, setCustomMessage] = useState('');
  const [aiTone, setAiTone] = useState<'sopan' | 'tegas' | 'ramah'>('sopan');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Scan & generate automatic reminders on mount or student list change
  useEffect(() => {
    const autoReminders = generateAutomaticReminders(students, info.subjectName, info.kkm);
    setReminders(autoReminders);
  }, [students, info]);

  // Sync selected student from props if changed
  useEffect(() => {
    if (selectedStudentForReminder) {
      setTargetStudent(selectedStudentForReminder);
      setActiveTab('wa');
      if (selectedStudentForReminder.status === 'Belum Tuntas (Remedial)') {
        setReminderType('remedial');
      } else if (selectedStudentForReminder.status === 'Belum Lengkap') {
        setReminderType('tugas');
      }
    }
  }, [selectedStudentForReminder]);

  // Update draft message whenever target student or type changes
  useEffect(() => {
    if (!targetStudent) return;

    const missingFields: string[] = [];
    if (targetStudent.nilaiTugas === null) missingFields.push('Nilai Tugas');
    if (targetStudent.nilaiTP === null) missingFields.push('Nilai TP');
    if (targetStudent.nilaiFormatif === null) missingFields.push('Nilai Formatif');
    if (targetStudent.nilaiSumatif === null) missingFields.push('Nilai Sumatif');

    let msg = '';
    if (reminderType === 'remedial') {
      msg = `Assalamu'alaikum wr. wb. / Selamat Pagi Yth. Bapak/Ibu Wali dari *${targetStudent.nama}*.\n\n` +
        `Kami menginformasikan bahwa perolehan nilai akhir mata pelajaran *${info.subjectName}* saat ini adalah *${targetStudent.rataRataAkhir ?? '-'}* (Batas KKM/KKTP: ${info.kkm}).\n\n` +
        `Sehubungan dengan hal tersebut, ananda *${targetStudent.nama}* perlu mengikuti program *Perbaikan/Remedial* agar mencapai ketuntasan.\n\n` +
        `Mohon arahan dan motivasinya di rumah. Terima kasih.\n\n` +
        `Hormat kami,\n${info.teacherName} (${info.schoolName})`;
    } else if (reminderType === 'tugas') {
      msg = `Assalamu'alaikum wr. wb. / Selamat Pagi Yth. Bapak/Ibu Wali dari *${targetStudent.nama}*.\n\n` +
        `Diberitahukan bahwa komponen nilai mata pelajaran *${info.subjectName}* ananda masih belum lengkap, yaitu: *${missingFields.join(', ')}*.\n\n` +
        `Mohon bantuan Bapak/Ibu untuk mengingatkan ananda agar segera mengumpulkan tugas/kegiatan susulan tersebut.\n\n` +
        `Terima kasih atas kerja samanya.\n\n` +
        `Hormat kami,\n${info.teacherName} (${info.schoolName})`;
    } else {
      msg = `Assalamu'alaikum wr. wb. Yth. Bapak/Ibu Wali dari *${targetStudent.nama}*.\n\n` +
        `Mengingatkan jadwal *Pelaksanaan Remedial & Susulan* mata pelajaran *${info.subjectName}* yang akan dilaksanakan pada:\n` +
        `📅 Hari/Tgl: [Tentukan Hari/Tanggal]\n` +
        `⏰ Waktu: 13.00 WIB\n` +
        `📍 Tempat: Ruang Kelas ${info.className}\n\n` +
        `Mohon dipastikan ananda hadir tepat waktu. Terima kasih.`;
    }

    setCustomMessage(msg);
  }, [targetStudent, reminderType, info]);

  // AI draft polish handler
  const handlePolishMessageWithAi = async () => {
    if (!targetStudent) return;
    setIsGeneratingAi(true);

    try {
      const missingFields: string[] = [];
      if (targetStudent.nilaiTugas === null) missingFields.push('Nilai Tugas');
      if (targetStudent.nilaiTP === null) missingFields.push('Nilai TP');
      if (targetStudent.nilaiFormatif === null) missingFields.push('Nilai Formatif');
      if (targetStudent.nilaiSumatif === null) missingFields.push('Nilai Sumatif');

      const res = await fetch('/api/ai/draft-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: targetStudent.nama,
          subjectName: info.subjectName,
          missingFields,
          currentScore: targetStudent.rataRataAkhir ?? 'Belum Lengkap',
          kkm: info.kkm,
          reminderType: reminderType === 'remedial' ? 'Remedial' : reminderType === 'tugas' ? 'Komponen Nilai Kosong' : 'Jadwal Tes',
          tone: aiTone === 'sopan' ? 'Sangat Sopan & Resmi' : aiTone === 'tegas' ? 'Tegas & Jelas' : 'Warm, Ramah & Motivatif'
        })
      });

      const data = await res.json();
      if (data.success && data.draftMessage) {
        setCustomMessage(data.draftMessage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const formatPhoneNumberForWA = (phone: string): string => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
  };

  const handleSendWhatsApp = () => {
    if (!targetStudent || !targetStudent.teleponOrtu) {
      alert('Nomor telepon/WhatsApp orang tua belum diisi.');
      return;
    }
    const cleanPhone = formatPhoneNumberForWA(targetStudent.teleponOrtu);
    const encodedMsg = encodeURIComponent(customMessage);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
    window.open(waUrl, '_blank');
  };

  const toggleReminderStatus = (id: string) => {
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, status: r.status === 'sent' ? 'pending' : 'sent' } : r)
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info Card */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl">
            <BellRing className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Sistem Pengingat Otomatis (Auto-Reminder)</h2>
            <p className="text-xs text-amber-100 mt-1">
              Deteksi otomatis siswa perlu remedial atau nilai belum lengkap & pengiriman pesan WhatsApp/Surat ortu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-xs">
          <div>
            <span className="block text-amber-100 text-[10px]">Perlu Tindakan:</span>
            <span className="font-bold text-sm text-white">{reminders.length} Siswa Detected</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs inside Reminder System */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Daftar Pengingat Otomatis ({reminders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'wa'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Kirim WhatsApp Orang Tua</span>
        </button>

        <button
          onClick={() => setActiveTab('letter')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'letter'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Draf Surat Pemberitahuan</span>
        </button>
      </div>

      {/* TAB 1: AUTOMATIC ALERTS LIST */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Siswa Memerlukan Tindakan / Pengingat</span>
            </h3>
          </div>

          {reminders.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">Semua Nilai Siswa Tuntas & Lengkap!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tidak ada siswa yang nilai tugasnya kosong atau di bawah KKM ({info.kkm}). Semua berjalan baik!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reminders.map((rem) => {
                const stu = students.find(s => s.id === rem.studentId);
                const isSent = rem.status === 'sent';

                return (
                  <div 
                    key={rem.id}
                    className={`bg-white rounded-2xl p-4 border transition-all ${
                      isSent ? 'border-slate-200 bg-slate-50/60 opacity-75' : 'border-amber-200 shadow-xs hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rem.type === 'tugas_kosong' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {rem.type === 'tugas_kosong' ? 'Tugas Kosong' : 'Perlu Remedial'}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{rem.studentName}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-700 mt-2">{rem.title}</h4>
                      </div>

                      <button
                        onClick={() => toggleReminderStatus(rem.id)}
                        className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                          isSent ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSent ? 'Terkirim' : 'Tandai Terkirim'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mt-3 border border-slate-100">
                      "{rem.message}"
                    </p>

                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        Ortu: {rem.teleponOrtu || 'Belum diisi'}
                      </span>

                      {stu && (
                        <button
                          onClick={() => {
                            setTargetStudent(stu);
                            setActiveTab('wa');
                          }}
                          className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer text-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Kirim via WA</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WHATSAPP DIRECT SENDER */}
      {activeTab === 'wa' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Student Selector & Config */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Pesan WA</span>
            </h3>

            {/* Choose Student */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Siswa Target:</label>
              <select
                value={targetStudent?.id || ''}
                onChange={(e) => {
                  const found = students.find(s => s.id === e.target.value);
                  setTargetStudent(found || null);
                }}
                className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Reminder Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Pengingat:</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setReminderType('remedial')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] cursor-pointer transition-all ${
                    reminderType === 'remedial' ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Remedial
                </button>
                <button
                  type="button"
                  onClick={() => setReminderType('tugas')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] cursor-pointer transition-all ${
                    reminderType === 'tugas' ? 'bg-white text-amber-700 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Nilai Kosong
                </button>
                <button
                  type="button"
                  onClick={() => setReminderType('jadwal')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] cursor-pointer transition-all ${
                    reminderType === 'jadwal' ? 'bg-white text-sky-700 font-bold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Jadwal Tes
                </button>
              </div>
            </div>

            {/* AI Polish Tone Option */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Nada Pesan AI:</label>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setAiTone('sopan')}
                  className={`flex-1 py-1 px-2 rounded-lg border text-[11px] cursor-pointer ${
                    aiTone === 'sopan' ? 'bg-purple-100 text-purple-800 border-purple-300 font-semibold' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Sopan Resmi
                </button>
                <button
                  onClick={() => setAiTone('ramah')}
                  className={`flex-1 py-1 px-2 rounded-lg border text-[11px] cursor-pointer ${
                    aiTone === 'ramah' ? 'bg-purple-100 text-purple-800 border-purple-300 font-semibold' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Ramah
                </button>
                <button
                  onClick={() => setAiTone('tegas')}
                  className={`flex-1 py-1 px-2 rounded-lg border text-[11px] cursor-pointer ${
                    aiTone === 'tegas' ? 'bg-purple-100 text-purple-800 border-purple-300 font-semibold' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Tegas
                </button>
              </div>

              <button
                onClick={handlePolishMessageWithAi}
                disabled={isGeneratingAi}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingAi ? 'Sedang Diproses AI...' : 'Polish Draf dengan AI'}</span>
              </button>
            </div>

          </div>

          {/* Message Preview & Action */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-slate-800">Pratinjau Pesan WhatsApp</h3>
                {targetStudent && (
                  <span className="text-xs font-medium text-slate-500">
                    No. Ortu: <strong className="text-slate-800">{targetStudent.teleponOrtu || 'Belum Ada'}</strong>
                  </span>
                )}
              </div>

              <textarea
                rows={10}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full mt-3 p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {copiedSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSuccess ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer hover:shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>Kirim via WhatsApp Sekarang</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: OFFICIAL LETTER DRAFT */}
      {activeTab === 'letter' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Draf Surat Pemberitahuan Program Remedial Siswa</span>
            </h3>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-700 cursor-pointer"
            >
              <span>Cetak / Print Surat</span>
            </button>
          </div>

          <div className="p-8 border border-slate-300 rounded-2xl bg-white font-serif text-slate-900 text-xs space-y-4 shadow-inner max-w-3xl mx-auto">
            <div className="text-center border-b-2 border-slate-900 pb-4">
              <h2 className="text-base font-bold uppercase tracking-wide">{info.schoolName}</h2>
              <p className="text-[10px] text-slate-600 font-sans italic">Alamat Sekolah: Jl. Pendidikan No. 10 | Telp: (021) 555-0199</p>
            </div>

            <div className="flex justify-between font-sans text-[11px] pt-2">
              <div>
                <p>Nomor : 045/PAN-NILAI/2026</p>
                <p>Hal : Pemberitahuan Program Remedial & Perbaikan Nilai</p>
              </div>
              <div>
                <p>Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 font-sans text-xs">
              <p>Kepada Yth.</p>
              <p><strong>Bapak/Ibu Orang Tua/Wali Siswa</strong></p>
              <p>di Tempat</p>
            </div>

            <p className="leading-relaxed font-sans text-xs">
              Dengan hormat,<br />
              Sehubungan dengan telah selesainya rekapitulasi penilaian pada mata pelajaran <strong>{info.subjectName}</strong> ({info.className}) Semester {info.semester} TA {info.academicYear}, bersama ini kami sampaikan bahwa terdapat beberapa siswa yang belum mencapai Kriteria Ketercapaian Tujuan Pembelajaran (KKTP/KKM: {info.kkm}).
            </p>

            <div className="py-2">
              <p className="font-sans font-bold text-xs mb-2">Daftar Siswa yang Dijadwalkan Mengikuti Remedial:</p>
              <table className="w-full border-collapse border border-slate-400 font-sans text-xs">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="border border-slate-400 p-2 text-center w-10">No</th>
                    <th className="border border-slate-400 p-2">NIS</th>
                    <th className="border border-slate-400 p-2">Nama Siswa</th>
                    <th className="border border-slate-400 p-2 text-center">Rata-Rata</th>
                    <th className="border border-slate-400 p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.status === 'Belum Tuntas (Remedial)').map((s, idx) => (
                    <tr key={s.id}>
                      <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-400 p-2">{s.nis}</td>
                      <td className="border border-slate-400 p-2 font-semibold">{s.nama}</td>
                      <td className="border border-slate-400 p-2 text-center text-rose-600 font-bold">{s.rataRataAkhir}</td>
                      <td className="border border-slate-400 p-2 text-center">Remedial</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="leading-relaxed font-sans text-xs">
              Demikian surat pemberitahuan ini kami sampaikan. Mohon bantuan dan perhatian Bapak/Ibu untuk mendampingi putra/putrinya. Atas perhatian dan kerja samanya kami ucapkan terima kasih.
            </p>

            <div className="pt-8 flex justify-end font-sans text-xs">
              <div className="text-center w-56">
                <p>Guru Pengampu,</p>
                <div className="h-16"></div>
                <p className="font-bold border-b border-slate-800 pb-0.5">{info.teacherName}</p>
                <p className="text-[10px] text-slate-500">NIP. 19850412 201001 1 008</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
