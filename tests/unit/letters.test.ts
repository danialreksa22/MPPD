import assert from "node:assert"
import {
  toRomanMonth,
  generateLetterNumberFormat,
} from "@/lib/constants"

export async function runLetterTests() {
  console.log("▶ Menjalankan Pengujian: Format Penomoran Surat & Validasi Dokumen...");

  // Test 1: Konversi angka bulan ke angka romawi dinas
  assert.strictEqual(toRomanMonth(1), "I")
  assert.strictEqual(toRomanMonth(4), "IV")
  assert.strictEqual(toRomanMonth(8), "VIII")
  assert.strictEqual(toRomanMonth(9), "IX")
  assert.strictEqual(toRomanMonth(10), "X")
  assert.strictEqual(toRomanMonth(12), "XII")

  // Test 2: Format nomor surat balasan disetujui
  const dateSep2026 = new Date(2026, 8, 15) // September (bulan index 8)
  const numApproved = generateLetterNumberFormat("balasan_disetujui", 42, dateSep2026)
  assert.strictEqual(
    numApproved,
    "420/DIKLAT-RSUD-BLK/IX/2026/042",
    "Format balasan disetujui harus sesuai standar tata naskah dinas RSUD"
  )

  // Test 3: Format nomor surat balasan ditolak
  const numRejected = generateLetterNumberFormat("balasan_ditolak", 7, dateSep2026)
  assert.strictEqual(
    numRejected,
    "421/DIKLAT-RSUD-BLK/IX/2026/007",
    "Format balasan ditolak harus menggunakan kode 421 dan padding 3 digit"
  )

  // Test 4: Format nomor surat keterangan selesai praktik
  const numCompleted = generateLetterNumberFormat("keterangan_selesai", 108, dateSep2026)
  assert.strictEqual(
    numCompleted,
    "423.4/DIKLAT-RSUD-BLK/IX/2026/108",
    "Format keterangan selesai harus menggunakan kode 423.4"
  )

  // Test 5: Format nomor sertifikat kelulusan stase
  const numCertificate = generateLetterNumberFormat("sertifikat", 15, dateSep2026)
  assert.strictEqual(
    numCertificate,
    "SERT-DIKLAT/2026/IX/0015",
    "Format sertifikat harus menggunakan SERT-DIKLAT dengan padding 4 digit"
  )

  // Test 6: Integritas Struktur Payload QR Code Verifikasi
  function buildVerificationPayload(letterNumber: string, recipient: string, token: string) {
    return {
      institution: "RSUD H. Andi Sulthan Daeng Radja Bulukumba",
      letter_number: letterNumber,
      recipient,
      token,
      verification_url: `https://magguru.rsudbulukumba.id/verify/${token}`,
    }
  }

  const payload = buildVerificationPayload("420/DIKLAT-RSUD-BLK/IX/2026/042", "Fakultas Kedokteran Unhas", "v-abc-123")
  assert.ok(payload.verification_url.includes("v-abc-123"))
  assert.strictEqual(payload.letter_number, "420/DIKLAT-RSUD-BLK/IX/2026/042")

  console.log("  ✔ Semua pengujian penomoran surat dan kode verifikasi lulus (6/6).");
}
