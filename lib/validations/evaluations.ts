import { z } from "zod"

export const EVALUATION_ASPECTS = [
  {
    key: "aspect_teaching_score",
    label: "Bimbingan & Pengajaran Klinik (CI / DPJP)",
    desc: "Kemudahan konsultasi, bimbingan bedside teaching, dan umpan balik konstruktif dari pembimbing.",
  },
  {
    key: "aspect_facilities_score",
    label: "Fasilitas & Sarana Ruangan",
    desc: "Ketersediaan APD, loker mahasiswa, ruang istirahat/diskusi, dan kebersihan unit dinas.",
  },
  {
    key: "aspect_cases_score",
    label: "Variasi & Kuantitas Kasus Pasien",
    desc: "Kecukupan ragam diagnosa dan tindakan medis/keperawatan sesuai target kompetensi modul.",
  },
  {
    key: "aspect_safety_score",
    label: "Keselamatan Kerja & Pencegahan Infeksi (K3 / PPI)",
    desc: "Penerapan standar keselamatan pasien, pencegahan tertusuk jarum, dan budaya keselamatan kerja.",
  },
] as const

export const staseEvaluationFormSchema = z.object({
  placement_id: z.string().min(1, "Penempatan stase wajib dipilih"),
  student_id: z.string().min(1, "ID mahasiswa wajib ada"),
  room_id: z.string().min(1, "Ruangan stase wajib ada"),
  preceptor_id: z.string().optional().nullable(),
  aspect_teaching_score: z.number().int().min(1).max(5, "Skor bimbingan skala 1-5"),
  aspect_facilities_score: z.number().int().min(1).max(5, "Skor fasilitas skala 1-5"),
  aspect_cases_score: z.number().int().min(1).max(5, "Skor variasi kasus skala 1-5"),
  aspect_safety_score: z.number().int().min(1).max(5, "Skor K3/PPI skala 1-5"),
  strengths: z.string().max(1000, "Catatan kelebihan maksimal 1000 karakter").optional().nullable(),
  suggestions: z.string().max(1000, "Saran perbaikan maksimal 1000 karakter").optional().nullable(),
  is_anonymous: z.boolean().default(true),
})

export type StaseEvaluationFormInput = z.infer<typeof staseEvaluationFormSchema>

export function calculateOverallEvaluationScore(
  teaching: number,
  facilities: number,
  cases: number,
  safety: number
): number {
  const avg = (teaching + facilities + cases + safety) / 4
  return Math.round(avg * 100) / 100
}
