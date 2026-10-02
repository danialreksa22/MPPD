import { z } from "zod"

export const rosterScheduleSchema = z.object({
  id: z.string().uuid().optional(),
  placement_id: z.string().min(1, "Penempatan stase wajib dipilih"),
  student_id: z.string().min(1, "Mahasiswa wajib dipilih"),
  room_id: z.string().min(1, "Ruangan dinas wajib dipilih"),
  shift_id: z.string().nullable().optional(), // null berarti Libur / Lepas Jaga
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  notes: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable(),
})

export type RosterScheduleInput = z.infer<typeof rosterScheduleSchema>

export const batchRosterGeneratorSchema = z.object({
  room_id: z.string().min(1, "Pilih ruangan dinas"),
  student_ids: z.array(z.string().min(1)).min(1, "Pilih minimal 1 mahasiswa"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal mulai YYYY-MM-DD"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal selesai YYYY-MM-DD"),
  pattern: z.enum([
    "pagi_siang_malam_libur", // Pola 4 Hari Standar RSUD: Pagi -> Siang -> Malam -> Lepas/Libur
    "pagi_siang_libur",       // Pola 3 Hari: Pagi -> Siang -> Libur
    "pagi_only",              // Dinas Pagi Terus (Poli / Rawat Jalan)
    "rotasi_kelompok",        // Rotasi bergantian tiap minggu
  ]),
  notes: z.string().optional().nullable(),
})

export type BatchRosterGeneratorInput = z.infer<typeof batchRosterGeneratorSchema>

export const rosterSwapRequestSchema = z.object({
  requester_schedule_id: z.string().min(1, "Jadwal dinas pemohon wajib ada"),
  requester_student_id: z.string().min(1, "Identitas pemohon tidak valid"),
  target_schedule_id: z.string().min(1, "Pilih jadwal rekan yang diajak bertukar"),
  target_student_id: z.string().min(1, "Pilih rekan stase yang bersedia tukar"),
  reason: z.string().min(5, "Alasan tukar dinas wajib diisi minimal 5 karakter"),
})

export type RosterSwapRequestInput = z.infer<typeof rosterSwapRequestSchema>

export const rosterSwapResponseSchema = z.object({
  swap_id: z.string().min(1, "ID permohonan tukar dinas tidak valid"),
  status: z.enum(["approved", "rejected"]),
  rejection_reason: z.string().optional().nullable(),
})

export type RosterSwapResponseInput = z.infer<typeof rosterSwapResponseSchema>
