export const APP_CONFIG = {
  name: "MAGGURU",
  fullName: "Sistem Informasi Mahasiswa Praktik Klinik & MPPD Kedokteran",
  institution: "RSUD H. Andi Sulthan Daeng Radja Bulukumba",
  shortInstitution: "RSUD Bulukumba",
  division: "Bidang Pendidikan dan Pelatihan (Diklat)",
  address: "Jl. Serikaya No. 17, Bulukumba, Sulawesi Selatan",
  version: "1.0.0",
} as const

export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN_DIKLAT: "admin_diklat",
  KEPALA_RUANGAN: "kepala_ruangan",
  PRESEPTOR: "preseptor",
  SUPERVISOR_DOKTER: "supervisor_dokter",
  PIC_INSTITUSI: "pic_institusi",
  MAHASISWA: "mahasiswa",
  DIREKTUR: "direktur",
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin_diklat: "Admin Diklat",
  kepala_ruangan: "Kepala Ruangan / Unit",
  preseptor: "Preseptor / CI",
  supervisor_dokter: "Supervisor Dokter (MPPD)",
  pic_institusi: "PIC Institusi Pendidikan",
  mahasiswa: "Mahasiswa Praktik / MPPD",
  direktur: "Direktur / Manajemen",
}

export const APPLICATION_STATUS = {
  DIAJUKAN: "diajukan",
  DIVERIFIKASI: "diverifikasi",
  DISETUJUI: "disetujui",
  DITOLAK: "ditolak",
  AKTIF: "aktif",
  SELESAI: "selesai",
} as const

export type ApplicationStatus =
  (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS]

export const APPLICATION_STATUS_LABELS: Record<
  ApplicationStatus,
  { label: string; color: string }
> = {
  diajukan: {
    label: "Diajukan",
    color: "bg-amber-100 text-amber-800 border-amber-300",
  },
  diverifikasi: {
    label: "Diverifikasi",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  disetujui: {
    label: "Disetujui",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  ditolak: {
    label: "Ditolak",
    color: "bg-rose-100 text-rose-800 border-rose-300",
  },
  aktif: {
    label: "Praktik Aktif",
    color: "bg-teal-100 text-teal-800 border-teal-300",
  },
  selesai: {
    label: "Selesai Praktik",
    color: "bg-slate-100 text-slate-800 border-slate-300",
  },
}

export const STUDENT_TYPES = {
  PRAKTIK_KLINIK: "praktik_klinik",
  MPPD: "mppd",
} as const

export type StudentType = (typeof STUDENT_TYPES)[keyof typeof STUDENT_TYPES]

export const STUDENT_TYPE_LABELS: Record<StudentType, string> = {
  praktik_klinik: "Praktik Klinik (Keperawatan, Kebidanan, Farmasi, Gizi, dll)",
  mppd: "MPPD Kedokteran (Koas / Dokter Muda / Residen)",
}

export const PLACEMENT_STATUS = {
  SCHEDULED: "scheduled",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const

export type PlacementStatus =
  (typeof PLACEMENT_STATUS)[keyof typeof PLACEMENT_STATUS]

export const PLACEMENT_STATUS_LABELS: Record<
  PlacementStatus,
  { label: string; color: string }
> = {
  scheduled: {
    label: "Terjadwal",
    color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
  },
  active: {
    label: "Aktif Berjalan",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  completed: {
    label: "Selesai Stase",
    color: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-300",
  },
  cancelled: {
    label: "Dibatalkan",
    color: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300",
  },
}

export const ATTENDANCE_STATUS = {
  HADIR: "hadir",
  IZIN: "izin",
  SAKIT: "sakit",
  ALPA: "alpa",
} as const

export type AttendanceStatus =
  (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS]

export const ATTENDANCE_STATUS_LABELS: Record<
  AttendanceStatus,
  { label: string; color: string }
> = {
  hadir: {
    label: "Hadir",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  izin: {
    label: "Izin",
    color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
  },
  sakit: {
    label: "Sakit",
    color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
  },
  alpa: {
    label: "Alpa / Tanpa Keterangan",
    color: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300",
  },
}

// ---------------------------------------------------------------------------
// MODUL 6: PENILAIAN KLINIK & EVALUASI STASE
// ---------------------------------------------------------------------------

export const PASSING_SCORE_THRESHOLD = 70.0 // Nilai minimal lulus stase RSUD Bulukumba (Huruf Mutu B)

export const DEFAULT_ASSESSMENT_WEIGHTS = {
  skills: 0.4, // Keterampilan Klinik: 40%
  attitude: 0.3, // Sikap & Perilaku: 30%
  knowledge: 0.3, // Pengetahuan & Teori: 30%
} as const

export interface GradeScale {
  letter: string
  minScore: number
  gpa: number
  label: string
  color: string
  passed: boolean
}

export const GRADE_SCALES: GradeScale[] = [
  {
    letter: "A",
    minScore: 85.0,
    gpa: 4.0,
    label: "Sangat Baik / Istimewa",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
    passed: true,
  },
  {
    letter: "A-",
    minScore: 80.0,
    gpa: 3.7,
    label: "Amat Baik",
    color: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300",
    passed: true,
  },
  {
    letter: "B+",
    minScore: 75.0,
    gpa: 3.3,
    label: "Baik Sekali",
    color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
    passed: true,
  },
  {
    letter: "B",
    minScore: 70.0,
    gpa: 3.0,
    label: "Baik (Batas Minimal Lulus)",
    color: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300",
    passed: true,
  },
  {
    letter: "B-",
    minScore: 65.0,
    gpa: 2.7,
    label: "Cukup Baik (Remedial)",
    color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
    passed: false,
  },
  {
    letter: "C+",
    minScore: 60.0,
    gpa: 2.3,
    label: "Cukup",
    color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
    passed: false,
  },
  {
    letter: "C",
    minScore: 55.0,
    gpa: 2.0,
    label: "Kurang Cukup",
    color: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300",
    passed: false,
  },
  {
    letter: "D",
    minScore: 45.0,
    gpa: 1.0,
    label: "Kurang / Tidak Lulus",
    color: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300",
    passed: false,
  },
  {
    letter: "E",
    minScore: 0.0,
    gpa: 0.0,
    label: "Gagal / Mengulang Stase",
    color: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300",
    passed: false,
  },
]

export function calculateGradeLetter(score: number): GradeScale {
  for (const scale of GRADE_SCALES) {
    if (score >= scale.minScore) {
      return scale
    }
  }
  return GRADE_SCALES[GRADE_SCALES.length - 1]
}

export function calculateFinalScore(
  skills: number,
  attitude: number,
  knowledge: number,
  weights = DEFAULT_ASSESSMENT_WEIGHTS
): number {
  const s = Math.max(0, Math.min(100, skills))
  const a = Math.max(0, Math.min(100, attitude))
  const k = Math.max(0, Math.min(100, knowledge))
  const total = s * weights.skills + a * weights.attitude + k * weights.knowledge
  return Math.round(total * 100) / 100
}

export interface RubricTemplate {
  id: string
  name: string
  profession: string
  description: string
  skillsItems: string[]
  attitudeItems: string[]
  knowledgeItems: string[]
}

export const ASSESSMENT_RUBRIC_TEMPLATES: Record<string, RubricTemplate> = {
  mppd_kedokteran: {
    id: "mppd_kedokteran",
    name: "Kedokteran / MPPD (Dokter Muda / Koas)",
    profession: "Kedokteran",
    description: "Evaluasi kompetensi klinis berbasis Mini-CEX, DOPS, CBD, dan responsi kasus RSUD Bulukumba.",
    skillsItems: [
      "Mini-CEX: Kemampuan Anamnesis & Pemeriksaan Fisik Komprehensif",
      "DOPS: Keterampilan Tindakan / Prosedur Klinis Medis",
      "Perumusan Diagnosis Banding & Rencana Terapi / Edukasi Pasien",
    ],
    attitudeItems: [
      "Etika Kedokteran & Kepatuhan Hak Kerahasiaan Pasien",
      "Kedisiplinan, Kehadiran, & Tanggung Jawab Tugas Jaga",
      "Komunikasi Interpersonal dengan Pasien, Keluarga, & Rekan Sejawat",
    ],
    knowledgeItems: [
      "CBD: Case-Based Discussion & Analisis Penalaran Klinis",
      "Responsi Kasus / Bedside Teaching bersama DPJP",
      "Penguasaan Evidence-Based Medicine (EBM) & Panduan Praktik Klinis (PPK)",
    ],
  },
  keperawatan: {
    id: "keperawatan",
    name: "Keperawatan (Profesi Ners / D3 Keperawatan)",
    profession: "Keperawatan",
    description: "Evaluasi asuhan keperawatan, tindakan prosedural klinis, dan komunikasi terapeutik.",
    skillsItems: [
      "Pengkajian Keperawatan Komprehensif & Diagnosa Keperawatan",
      "Keterampilan Tindakan Prosedur Medis Sesuai SOP Rumah Sakit",
      "Pendokumentasian Asuhan Keperawatan (Askep) yang Akurat",
    ],
    attitudeItems: [
      "Komunikasi Terapeutik & Sikap Caring terhadap Pasien",
      "Kepatuhan Prinsip Patient Safety & PPI (Pencegahan Infeksi)",
      "Kedisiplinan Waktu Dinas & Kolaborasi Tim Kesehatan",
    ],
    knowledgeItems: [
      "Responsi Kasus & Rasionalisasi Ilmiah Tindakan Keperawatan",
      "Penguasaan Patofisiologi & Terapi Farmakologis Dasar",
      "Evaluasi & Modifikasi Rencana Asuhan Keperawatan",
    ],
  },
  kebidanan: {
    id: "kebidanan",
    name: "Kebidanan (Profesi Bidan / D3 Kebidanan)",
    profession: "Kebidanan",
    description: "Evaluasi asuhan kebidanan fisiologis & patologis, partograf, dan pemeriksaan maternal/neonatal.",
    skillsItems: [
      "Pemeriksaan ANC/PNC & Keterampilan Manajemen Persalinan Normal",
      "Pengisian & Interpretasi Lembar Partograf secara Tepat",
      "Keterampilan Penanganan Awal Kegawatdaruratan Maternal/Neonatal",
    ],
    attitudeItems: [
      "Empati, Kesabaran, & Komunikasi Efektif dengan Ibu & Keluarga",
      "Kepatuhan Aseptik & Pengendalian Infeksi di Ruang Bersalin",
      "Tanggung Jawab Etika Profesi Kebidanan",
    ],
    knowledgeItems: [
      "Responsi Asuhan Kebidanan Komprehensif (Metode SOAP)",
      "Penguasaan Konsep Fisiologis Reproduksi & Neonatologi",
      "KIE (Komunikasi, Informasi, & Edukasi) Kesehatan Reproduksi",
    ],
  },
  standard: {
    id: "standard",
    name: "Standar Umum Tenaga Kesehatan (Farmasi, Gizi, Radiologi, dll)",
    profession: "Kesehatan Terkait",
    description: "Evaluasi keterampilan teknis profesi, responsi teori, dan etika pelayanan kesehatan.",
    skillsItems: [
      "Keterampilan Teknis Spesifik Profesi & Kepatuhan SOP",
      "Ketelitian, Kecepatan, & Kualitas Output Pelayanan",
      "Kemandirian & Penguasaan Peralatan/Teknologi Medis",
    ],
    attitudeItems: [
      "Kedisiplinan, Tanggung Jawab, & Integritas Kerja",
      "Kerjasama Tim Lintas Profesi & Pelayanan Ramah",
      "Kepatuhan Keselamatan Pasien & Tata Tertib Rumah Sakit",
    ],
    knowledgeItems: [
      "Penguasaan Teori & Penerapan Konsep dalam Praktik",
      "Kemampuan Analisis Kasus & Pemecahan Masalah (Problem Solving)",
      "Responsi & Evaluasi Teori Akhir Stase",
    ],
  },
}

// ---------------------------------------------------------------------------
// MODUL 7: SURAT & DOKUMEN RESMI OTOMATIS
// ---------------------------------------------------------------------------

export const LETTER_TYPES = {
  BALASAN_DISETUJUI: "balasan_disetujui",
  BALASAN_DITOLAK: "balasan_ditolak",
  KETERANGAN_SELESAI: "keterangan_selesai",
  SERTIFIKAT: "sertifikat",
} as const

export type LetterType = (typeof LETTER_TYPES)[keyof typeof LETTER_TYPES]

export interface LetterTypeInfo {
  label: string
  shortLabel: string
  code: string
  color: string
  description: string
}

export const LETTER_TYPE_LABELS: Record<LetterType, LetterTypeInfo> = {
  balasan_disetujui: {
    label: "Surat Balasan Persetujuan Praktik Klinik",
    shortLabel: "Balasan Disetujui",
    code: "420",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
    description: "Surat dinas resmi persetujuan penerimaan praktik klinik/MPPD kepada institusi pendidikan.",
  },
  balasan_ditolak: {
    label: "Surat Balasan Penolakan / Keterbatasan Kuota",
    shortLabel: "Balasan Ditolak",
    code: "421",
    color: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300",
    description: "Surat pemberitahuan penolakan permohonan dinas karena kapasitas ruangan penuh atau berkas belum lengkap.",
  },
  keterangan_selesai: {
    label: "Surat Keterangan Selesai Praktik Klinik",
    shortLabel: "Keterangan Selesai",
    code: "423.4",
    color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
    description: "Surat keterangan resmi bahwa mahasiswa telah menyelesaikan rotasi stase dengan evaluasi yang tertera.",
  },
  sertifikat: {
    label: "Sertifikat Kelulusan Stase Praktik Klinik",
    shortLabel: "Sertifikat Stase",
    code: "SERT-DIKLAT",
    color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
    description: "Piagam sertifikat penghargaan kelulusan stase praktik klinik berstandar mutu RSUD Bulukumba.",
  },
}

export const DEFAULT_OFFICIAL_SIGNERS = {
  diklatHead: {
    name: "drg. Hj. Rismayanti, M.Kes",
    nip: "19780512 200604 2 015",
    title: "Kepala Instalasi Diklat & Komkordik",
  },
  director: {
    name: "dr. H. Rizal Ridwan Dappi, Sp.OG(K)., M.Kes",
    nip: "19720814 200212 1 006",
    title: "Direktur RSUD H. Andi Sulthan Daeng Radja",
  },
} as const

const ROMAN_MONTHS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
]

export function toRomanMonth(monthNumber: number): string {
  const index = Math.max(0, Math.min(11, monthNumber - 1))
  return ROMAN_MONTHS[index]
}

export function generateLetterNumberFormat(
  letterType: LetterType,
  sequenceNumber: number,
  date: Date = new Date()
): string {
  const year = date.getFullYear()
  const romanMonth = toRomanMonth(date.getMonth() + 1)
  const paddedSeq = String(sequenceNumber).padStart(3, "0")

  switch (letterType) {
    case "balasan_disetujui":
      return `420/DIKLAT-RSUD-BLK/${romanMonth}/${year}/${paddedSeq}`
    case "balasan_ditolak":
      return `421/DIKLAT-RSUD-BLK/${romanMonth}/${year}/${paddedSeq}`
    case "keterangan_selesai":
      return `423.4/DIKLAT-RSUD-BLK/${romanMonth}/${year}/${paddedSeq}`
    case "sertifikat": {
      const padded4 = String(sequenceNumber).padStart(4, "0")
      return `SERT-DIKLAT/${year}/${romanMonth}/${padded4}`
    }
  }
}

