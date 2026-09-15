import assert from "node:assert"

/**
 * Logika Kalkulasi Persentase Kehadiran & Kelayakan Mengikuti Evaluasi Stase
 * Batas minimal kehadiran RSUD Bulukumba: 80% (standar rotasi stase klinik)
 */
export function calculateAttendancePercentage(records: {
  hadir: number
  izin: number
  sakit: number
  alpa: number
}): { percentage: number; isEligible: boolean; total: number } {
  const total = records.hadir + records.izin + records.sakit + records.alpa
  if (total === 0) {
    return { percentage: 0, isEligible: false, total: 0 }
  }

  // Hanya status 'hadir' yang dihitung sebagai presensi fisik aktif
  const percentage = Math.round((records.hadir / total) * 100 * 10) / 10
  const isEligible = percentage >= 80.0

  return { percentage, isEligible, total }
}

export async function runAttendanceTests() {
  console.log("▶ Menjalankan Pengujian: Presensi, Rasio Kehadiran, & Syarat Kelayakan...");

  // Test 1: Mahasiswa dengan kehadiran 90% (18 hadir dari 20 hari dinas)
  const res1 = calculateAttendancePercentage({ hadir: 18, izin: 1, sakit: 1, alpa: 0 })
  assert.strictEqual(res1.percentage, 90.0)
  assert.strictEqual(res1.isEligible, true, "90% harus memenuhi syarat kelayakan ujian stase")
  assert.strictEqual(res1.total, 20)

  // Test 2: Mahasiswa persis pada ambang batas 80% (16 hadir dari 20 hari dinas)
  const res2 = calculateAttendancePercentage({ hadir: 16, izin: 2, sakit: 2, alpa: 0 })
  assert.strictEqual(res2.percentage, 80.0)
  assert.strictEqual(res2.isEligible, true, "Persis 80% harus memenuhi syarat kelayakan")

  // Test 3: Mahasiswa di bawah ambang batas (15 hadir dari 20 hari = 75%)
  const res3 = calculateAttendancePercentage({ hadir: 15, izin: 0, sakit: 0, alpa: 5 })
  assert.strictEqual(res3.percentage, 75.0)
  assert.strictEqual(res3.isEligible, false, "75% harus ditolak dari syarat kelayakan ujian stase")

  // Test 4: Kasus rekam kosong (0 hari)
  const resEmpty = calculateAttendancePercentage({ hadir: 0, izin: 0, sakit: 0, alpa: 0 })
  assert.strictEqual(resEmpty.percentage, 0)
  assert.strictEqual(resEmpty.isEligible, false)

  // Test 5: Validasi urutan waktu check-in dan check-out
  function isValidCheckOutTime(checkInIso: string, checkOutIso: string): boolean {
    return new Date(checkOutIso).getTime() >= new Date(checkInIso).getTime()
  }

  assert.strictEqual(
    isValidCheckOutTime("2026-10-01T07:30:00Z", "2026-10-01T15:30:00Z"),
    true,
    "Check-out setelah check-in harus valid"
  )
  assert.strictEqual(
    isValidCheckOutTime("2026-10-01T15:30:00Z", "2026-10-01T07:30:00Z"),
    false,
    "Check-out lebih awal dari check-in harus ditolak"
  )

  console.log("  ✔ Semua pengujian presensi dan batas kehadiran lulus (5/5).");
}
