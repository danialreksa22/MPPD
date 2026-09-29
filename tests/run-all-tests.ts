/**
 * MAGGURU RSUD H. Andi Sulthan Daeng Radja Bulukumba
 * Automated Test Runner — Pengujian Menyeluruh Tahap 10
 */

import { runQuotaTests } from "./unit/quota.test"
import { runGeofenceTests } from "./unit/geofence.test"
import { runAssessmentTests } from "./unit/assessments.test"
import { runAttendanceTests } from "./unit/attendances.test"
import { runLetterTests } from "./unit/letters.test"
import { runPrivacyTests } from "./unit/privacy.test"
import { runShiftTests } from "./unit/shifts.test"
import { runServiceTypeTests } from "./unit/service-types.test"
import { runPositionTests } from "./unit/positions.test"
import { runStudentPermissionTests } from "./unit/student-permissions.test"

async function main() {
  const startTime = Date.now()
  console.log("================================================================================")
  console.log("       MAGGURU RSUD BULUKUMBA — SUITE PENGUJIAN OTOMATIS & AUDIT KEAMANAN        ")
  console.log("================================================================================")
  console.log(`Waktu Mulai : ${new Date().toLocaleString("id-ID")}`)
  console.log("Standar Uji : Standar RS Pendidikan, UU PDP No. 27/2022, Standar Komkordik Diklat")
  console.log("--------------------------------------------------------------------------------\n")

  const testSuites = [
    { name: "1. Kuota Ruangan & Penjadwalan Rotasi Stase", fn: runQuotaTests },
    { name: "2. Telemetri Geofencing & Anti-Fake GPS", fn: runGeofenceTests },
    { name: "3. Penilaian Klinik, Bobot Komkordik, & Mutu", fn: runAssessmentTests },
    { name: "4. Rasio Presensi & Syarat Kelayakan Ujian", fn: runAttendanceTests },
    { name: "5. Format Penomoran Naskah Dinas & QR Verifikasi", fn: runLetterTests },
    { name: "6. Kepatuhan Privasi UU PDP & Sanitasi XSS", fn: runPrivacyTests },
    { name: "7. Manajemen Shift & Jam Kerja Mahasiswa Dinas", fn: runShiftTests },
    { name: "8. Master Data Jenis Pelayanan RSUD", fn: runServiceTypeTests },
    { name: "9. Master Data Jabatan RSUD & Komkordik", fn: runPositionTests },
    { name: "10. Hak Akses Mahasiswa (Presensi Mobile & Read-Only Nilai)", fn: runStudentPermissionTests },
  ]

  let passedSuites = 0
  const failedSuites: string[] = []

  for (const suite of testSuites) {
    try {
      await suite.fn()
      passedSuites++
      console.log("")
    } catch (err: unknown) {
      console.error(`\n❌ GAGAL pada ${suite.name}:`)
      console.error(err)
      failedSuites.push(suite.name)
      console.log("")
    }
  }

  const durationMs = Date.now() - startTime

  console.log("================================================================================")
  console.log("                            RINGKASAN HASIL PENGUJIAN                           ")
  console.log("================================================================================")
  console.log(`Total Suite Teruji : ${testSuites.length}`)
  console.log(`Suite Lulus        : ${passedSuites} / ${testSuites.length} (${Math.round((passedSuites / testSuites.length) * 100)}%)`)
  console.log(`Durasi Eksekusi    : ${durationMs} ms`)

  if (failedSuites.length > 0) {
    console.log(`Suite Gagal        : ${failedSuites.join(", ")}`)
    console.log("\n❌ Status Akhir: BEBERAPA PENGUJIAN GAGAL.")
    process.exit(1)
  } else {
    console.log("\n✅ Status Akhir: SELURUH PENGUJIAN OTOMATIS BERHASIL LULUS 100% (SEMPURNA).")
    console.log("Sistem MAGGURU siap untuk tahap penyerahan dan deployment produksi!")
    process.exit(0)
  }
}

main().catch((err) => {
  console.error("Fatal error saat menjalankan test runner:", err)
  process.exit(1)
})
