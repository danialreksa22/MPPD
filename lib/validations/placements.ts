import { z } from "zod"

export const singlePlacementSchema = z
  .object({
    student_id: z.string().min(1, "Mahasiswa wajib dipilih"),
    application_id: z.string().min(1, "Pengajuan terkait wajib ada"),
    period_id: z.string().min(1, "Periode gelombang wajib dipilih"),
    room_id: z.string().min(1, "Ruangan pelayanan wajib dipilih"),
    preceptor_id: z.string().optional().nullable(),
    rotation_order: z.coerce.number().int().min(1, "Urutan rotasi minimal 1").default(1),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal mulai harus YYYY-MM-DD"),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal selesai harus YYYY-MM-DD"),
    status: z
      .enum(["scheduled", "active", "completed", "cancelled"])
      .default("scheduled"),
  })
  .refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
    message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai stase",
    path: ["end_date"],
  })

export const rotationStageSchema = z
  .object({
    room_id: z.string().min(1, "Ruangan pelayanan wajib dipilih"),
    preceptor_id: z.string().optional().nullable(),
    rotation_order: z.coerce.number().int().min(1).default(1),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal mulai harus YYYY-MM-DD"),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal selesai harus YYYY-MM-DD"),
  })
  .refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
    message: "Tanggal selesai stase tidak boleh mendahului tanggal mulai",
    path: ["end_date"],
  })

export const multiRotationScheduleSchema = z.object({
  student_id: z.string().min(1, "Mahasiswa wajib dipilih"),
  application_id: z.string().min(1, "Pengajuan terkait wajib ada"),
  period_id: z.string().min(1, "Periode gelombang wajib dipilih"),
  rotations: z
    .array(rotationStageSchema)
    .min(1, "Minimal harus ada 1 jadwal stase rotasi"),
})

export const placementStatusSchema = z.object({
  placement_id: z.string().min(1, "ID penempatan wajib ada"),
  status: z.enum(["scheduled", "active", "completed", "cancelled"]),
})

export type SinglePlacementInput = z.infer<typeof singlePlacementSchema>
export type RotationStageInput = z.infer<typeof rotationStageSchema>
export type MultiRotationScheduleInput = z.infer<typeof multiRotationScheduleSchema>
export type PlacementStatusInput = z.infer<typeof placementStatusSchema>
