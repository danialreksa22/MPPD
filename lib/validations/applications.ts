import { z } from "zod"

export const individualApplicationSchema = z.object({
  institution_id: z.string().min(1, "Institusi pendidikan wajib dipilih"),
  period_id: z.string().min(1, "Periode gelombang praktik wajib dipilih"),
  study_program_id: z.string().min(1, "Program studi wajib dipilih"),
  type: z.enum(["praktik_klinik", "mppd"], {
    message: "Pilih kategori praktik yang valid",
  }),
  nim: z.string().min(3, "NIM minimal 3 karakter"),
  nik: z.string().optional().or(z.literal("")),
  full_name: z.string().min(3, "Nama lengkap mahasiswa minimal 3 karakter"),
  gender: z.enum(["L", "P"], {
    message: "Pilih jenis kelamin (L/P)",
  }),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  desired_room_id: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})

export type IndividualApplicationInput = z.infer<typeof individualApplicationSchema>

export const bulkStudentRowSchema = z.object({
  nim: z.string().min(2, "NIM wajib diisi"),
  nik: z.string().optional(),
  full_name: z.string().min(2, "Nama lengkap wajib diisi"),
  gender: z.enum(["L", "P"]).default("L"),
  study_program: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
})

export type BulkStudentRow = z.infer<typeof bulkStudentRowSchema>

export const applicationStatusUpdateSchema = z
  .object({
    application_id: z.string().min(1, "ID Pengajuan wajib diisi"),
    status: z.enum(["diajukan", "diverifikasi", "disetujui", "ditolak", "aktif", "selesai"], {
      message: "Status pengajuan tidak valid",
    }),
    rejection_reason: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.status === "ditolak") {
        return Boolean(data.rejection_reason && data.rejection_reason.trim().length > 0)
      }
      return true
    },
    {
      message: "Alasan penolakan wajib diisi jika status pengajuan ditolak",
      path: ["rejection_reason"],
    }
  )

export type ApplicationStatusUpdateInput = z.infer<typeof applicationStatusUpdateSchema>
