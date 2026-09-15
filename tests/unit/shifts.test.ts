import assert from "node:assert"
import {
  calculateShiftLateStatus,
  autoDetectCurrentShift,
  shiftFormSchema,
  WorkShift,
} from "@/lib/validations/shifts"

export async function runShiftTests() {
  console.log("▶ Menjalankan Pengujian: Manajemen Shift & Jam Kerja Mahasiswa RSUD Bulukumba...")

  const mockShifts: WorkShift[] = [
    {
      id: "shift-pagi",
      name: "Shift Pagi",
      code: "PAGI",
      start_time: "07:00",
      end_time: "14:00",
      check_in_start: "06:30",
      check_in_end: "08:30",
      check_out_start: "13:30",
      check_out_end: "15:00",
      late_tolerance_minutes: 15,
      is_cross_day: false,
      color: "sky",
      description: "Dinas pagi",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "shift-siang",
      name: "Shift Siang",
      code: "SIANG",
      start_time: "14:00",
      end_time: "21:00",
      check_in_start: "13:30",
      check_in_end: "15:30",
      check_out_start: "20:30",
      check_out_end: "22:00",
      late_tolerance_minutes: 15,
      is_cross_day: false,
      color: "amber",
      description: "Dinas siang",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "shift-malam",
      name: "Shift Malam / Jaga",
      code: "MALAM",
      start_time: "21:00",
      end_time: "07:00",
      check_in_start: "20:30",
      check_in_end: "22:30",
      check_out_start: "06:30",
      check_out_end: "08:00",
      late_tolerance_minutes: 15,
      is_cross_day: true,
      color: "indigo",
      description: "Dinas malam jaga lintas hari",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "shift-fullday",
      name: "Non-Shift (Poliklinik)",
      code: "POLI",
      start_time: "08:00",
      end_time: "16:00",
      check_in_start: "07:30",
      check_in_end: "09:00",
      check_out_start: "15:30",
      check_out_end: "17:00",
      late_tolerance_minutes: 15,
      is_cross_day: false,
      color: "emerald",
      description: "Dinas poliklinik",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  // Test 1: Check-in lebih awal atau tepat waktu (sebelum jam mulai, 06:45 pada shift 07:00)
  const shiftPagi = mockShifts[0]
  const earlyCheckIn = calculateShiftLateStatus(shiftPagi, new Date("2026-10-01T06:45:00"))
  assert.strictEqual(earlyCheckIn.isLate, false, "Check-in jam 06:45 pada shift 07:00 harus tepat waktu")
  assert.strictEqual(earlyCheckIn.lateMinutes, 0)

  // Test 2: Check-in dalam masa toleransi (grace period 15 menit, jam 07:10)
  const graceCheckIn = calculateShiftLateStatus(shiftPagi, new Date("2026-10-01T07:10:00"))
  assert.strictEqual(graceCheckIn.isLate, false, "Check-in jam 07:10 (toleransi 15m) harus dianggap tepat waktu")
  assert.strictEqual(graceCheckIn.lateMinutes, 0)

  // Test 3: Check-in melebihi batas toleransi (jam 07:25 pada shift 07:00 toleransi 15m)
  const lateCheckIn = calculateShiftLateStatus(shiftPagi, new Date("2026-10-01T07:25:00"))
  assert.strictEqual(lateCheckIn.isLate, true, "Check-in jam 07:25 harus dinyatakan terlambat")
  assert.strictEqual(lateCheckIn.lateMinutes, 25, "Keterlambatan harus terhitung 25 menit dari jam 07:00")

  // Test 4: Shift Malam Lintas Hari (Check-in tepat waktu jam 20:55)
  const shiftMalam = mockShifts[2]
  const malamOnTime = calculateShiftLateStatus(shiftMalam, new Date("2026-10-01T20:55:00"))
  assert.strictEqual(malamOnTime.isLate, false, "Check-in jam 20:55 pada shift malam 21:00 harus tepat waktu")
  assert.strictEqual(malamOnTime.lateMinutes, 0)

  // Test 5: Shift Malam Lintas Hari (Check-in terlambat jam 21:40)
  const malamLate = calculateShiftLateStatus(shiftMalam, new Date("2026-10-01T21:40:00"))
  assert.strictEqual(malamLate.isLate, true, "Check-in jam 21:40 harus dinyatakan terlambat")
  assert.strictEqual(malamLate.lateMinutes, 40, "Keterlambatan malam harus terhitung 40 menit")

  // Test 6: Auto-Deteksi Shift berdasarkan waktu saat ini
  const pagiTime = new Date("2026-10-01T07:15:00")
  const detectedPagi = autoDetectCurrentShift(mockShifts, pagiTime)
  assert.strictEqual(detectedPagi?.id, "shift-pagi", "Pukul 07:15 harus terdeteksi sebagai Shift Pagi")

  const siangTime = new Date("2026-10-01T14:30:00")
  const detectedSiang = autoDetectCurrentShift(mockShifts, siangTime)
  assert.strictEqual(detectedSiang?.id, "shift-siang", "Pukul 14:30 harus terdeteksi sebagai Shift Siang")

  const malamTime = new Date("2026-10-01T21:30:00")
  const detectedMalam = autoDetectCurrentShift(mockShifts, malamTime)
  assert.strictEqual(detectedMalam?.id, "shift-malam", "Pukul 21:30 harus terdeteksi sebagai Shift Malam")

  // Test 7: Validasi Skema Zod untuk Shift
  const validSchema = shiftFormSchema.safeParse({
    name: "Shift Sore Khusus",
    code: "SORE",
    start_time: "15:00",
    end_time: "22:00",
    check_in_start: "14:30",
    check_in_end: "16:00",
    check_out_start: "21:30",
    check_out_end: "23:00",
    late_tolerance_minutes: 10,
    is_cross_day: false,
    color: "amber",
    description: "Shift sore poliklinik",
    is_active: true,
  })
  assert.strictEqual(validSchema.success, true, "Data shift valid harus lolos validasi Zod")

  const invalidSchema = shiftFormSchema.safeParse({
    name: "", // Kosong
    code: "X", // Kurang dari 2 karakter
    start_time: "99:99", // Format waktu salah
    end_time: "14:00",
    late_tolerance_minutes: -5, // Nilai negatif tidak diperbolehkan
  })
  assert.strictEqual(invalidSchema.success, false, "Data shift tidak valid harus ditolak oleh Zod")

  console.log("  ✔ Seluruh pengujian logika shift, toleransi jam, dan auto-deteksi lulus (7/7).")
}
