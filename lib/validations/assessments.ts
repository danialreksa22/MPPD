import { z } from "zod"

/**
 * Skema validasi input penilaian evaluasi klinik stase mahasiswa.
 */
export const assessmentFormSchema = z.object({
  id: z.string().uuid().optional(),
  placement_id: z.string().uuid({
    message: "Jadwal penempatan / stase wajib dipilih",
  }),
  student_id: z.string().uuid({
    message: "Mahasiswa wajib dipilih",
  }),
  evaluator_id: z.string().uuid().optional(),
  score_clinical_skills: z.coerce
    .number()
    .min(0, "Nilai keterampilan minimal 0")
    .max(100, "Nilai keterampilan maksimal 100"),
  score_attitude: z.coerce
    .number()
    .min(0, "Nilai sikap minimal 0")
    .max(100, "Nilai sikap maksimal 100"),
  score_knowledge: z.coerce
    .number()
    .min(0, "Nilai pengetahuan minimal 0")
    .max(100, "Nilai pengetahuan maksimal 100"),
  rubric_template: z.string().default("standard"),
  rubric_detail: z.record(z.string(), z.unknown()).optional(),
  feedback: z
    .string()
    .max(2000, "Catatan evaluasi maksimal 2000 karakter")
    .optional()
    .nullable(),
  assessment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Format tanggal evaluasi harus YYYY-MM-DD",
  }),
  is_finalized: z.boolean().default(false),
})

export type AssessmentFormInput = z.infer<typeof assessmentFormSchema>

/**
 * Skema validasi finalisasi (kunci) penilaian stase.
 */
export const finalizeAssessmentSchema = z.object({
  id: z.string().uuid({
    message: "ID penilaian tidak valid",
  }),
})

export type FinalizeAssessmentInput = z.infer<typeof finalizeAssessmentSchema>
