import { z } from "zod"

export const checkInSchema = z.object({
  placement_id: z.string().min(1, "Penempatan dinas aktif wajib dipilih"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional(),
  status: z.enum(["hadir", "izin", "sakit", "alpa"]).default("hadir"),
  notes: z.string().optional().nullable(),
  shift_id: z.string().optional().nullable(),
  shift_name: z.string().optional().nullable(),
})

export const checkOutSchema = z.object({
  attendance_id: z.string().min(1, "ID presensi wajib ada"),
})

export const approveAttendanceSchema = z.object({
  attendance_id: z.string().min(1, "ID presensi wajib ada"),
  is_approved: z.boolean().default(true),
})

export const bulkApproveAttendanceSchema = z.object({
  attendance_ids: z.array(z.string()).min(1, "Minimal pilih 1 presensi untuk disetujui"),
})

export const manualAttendanceSchema = z.object({
  student_id: z.string().min(1, "Mahasiswa wajib dipilih"),
  placement_id: z.string().min(1, "Jadwal penempatan wajib ada"),
  room_id: z.string().min(1, "Ruangan wajib ada"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  status: z.enum(["hadir", "izin", "sakit", "alpa"]),
  check_in_time: z.string().optional().nullable(),
  check_out_time: z.string().optional().nullable(),
  shift_id: z.string().optional().nullable(),
  shift_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_approved: z.boolean().default(true),
})

export type CheckInInput = z.infer<typeof checkInSchema>
export type CheckOutInput = z.infer<typeof checkOutSchema>
export type ApproveAttendanceInput = z.infer<typeof approveAttendanceSchema>
export type BulkApproveAttendanceInput = z.infer<typeof bulkApproveAttendanceSchema>
export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>
