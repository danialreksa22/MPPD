/**
 * MAGGURU RSUD H. Andi Sulthan Daeng Radja Bulukumba
 * Unit Tests: Modul Roster Jaga Dinas Mahasiswa & Pengajuan Tukar Shift
 */

import {
  rosterScheduleSchema,
  batchRosterGeneratorSchema,
  rosterSwapRequestSchema,
  rosterSwapResponseSchema,
} from "../../lib/validations/roster"
import { USER_ROLES } from "../../lib/constants"

export async function runRosterTests() {
  console.log("▶ Menjalankan Pengujian: Roster Jaga Dinas & Permohonan Tukar Shift...")

  // Test 1: Validasi Skema Roster Schedule
  const validSchedule = {
    placement_id: "00000000-0000-0000-0000-000000000001",
    student_id: "00000000-0000-0000-0000-000000000002",
    room_id: "00000000-0000-0000-0000-000000000003",
    shift_id: "00000000-0000-0000-0000-000000000004",
    date: "2026-10-15",
    notes: "Dinas Jaga Ruang Bedah",
  }

  const parseSched = rosterScheduleSchema.safeParse(validSchedule)
  if (!parseSched.success) {
    throw new Error(`Skema roster valid gagal diparse: ${JSON.stringify(parseSched.error)}`)
  }

  // Test 2: Tanggal Salah Format Harus Ditolak
  const invalidDateSched = { ...validSchedule, date: "15-10-2026" }
  if (rosterScheduleSchema.safeParse(invalidDateSched).success) {
    throw new Error("Skema roster harus menolak format tanggal selain YYYY-MM-DD")
  }

  // Test 3: Validasi Generator Roster Batch
  const validGenerator = {
    room_id: "room-igd",
    student_ids: ["student-1", "student-2", "student-3"],
    start_date: "2026-10-01",
    end_date: "2026-10-31",
    pattern: "pagi_siang_malam_libur" as const,
    notes: "Batch rotasi 1",
  }

  const parseGen = batchRosterGeneratorSchema.safeParse(validGenerator)
  if (!parseGen.success) {
    throw new Error("Skema batch generator roster gagal diparse")
  }

  // Test 4: Generator Harus Menolak Jika Tidak Ada Mahasiswa
  const emptyStudentsGen = { ...validGenerator, student_ids: [] }
  if (batchRosterGeneratorSchema.safeParse(emptyStudentsGen).success) {
    throw new Error("Batch generator harus menolak jika daftar mahasiswa kosong")
  }

  // Test 5: Validasi Pengajuan Tukar Dinas Mahasiswa
  const validSwapRequest = {
    requester_schedule_id: "sched-1",
    requester_student_id: "student-1",
    target_schedule_id: "sched-2",
    target_student_id: "student-2",
    reason: "Ada ujian proposal skripsi",
  }

  const parseSwap = rosterSwapRequestSchema.safeParse(validSwapRequest)
  if (!parseSwap.success) {
    throw new Error("Skema permohonan tukar dinas gagal diparse")
  }

  // Test 6: Alasan Tukar Kurang dari 5 Karakter Ditolak
  const shortReasonSwap = { ...validSwapRequest, reason: "Izin" } // 4 karakter, harus ditolak min(5)
  if (rosterSwapRequestSchema.safeParse(shortReasonSwap).success) {
    throw new Error("Alasan tukar dinas harus minimal 5 karakter")
  }

  // Test 7: Validasi Respon Verifikasi Kepala Ruangan
  const validResponse = {
    swap_id: "swap-123",
    status: "approved" as const,
  }
  if (!rosterSwapResponseSchema.safeParse(validResponse).success) {
    throw new Error("Skema respon tukar dinas gagal diparse")
  }

  console.log("  ✔ Seluruh pengujian skema dan logika roster dinas lulus (7/7).")
}
