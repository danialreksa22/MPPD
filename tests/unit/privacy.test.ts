import assert from "node:assert"
import {
  maskNik,
  maskPhone,
  maskEmail,
  sanitizeInput,
} from "@/lib/security/privacy"

export async function runPrivacyTests() {
  console.log("▶ Menjalankan Pengujian: Kepatuhan UU PDP No. 27/2022 & Masking Data...");

  // Test 1: Penyamaran NIK 16-digit standar
  const nik = "7302011234560001"
  const maskedNik = maskNik(nik)
  assert.strictEqual(
    maskedNik,
    "730201******0001",
    "NIK harus disamarkan dengan menjaga 6 digit awal dan 4 digit akhir"
  )
  assert.strictEqual(maskedNik.length, 16)

  // Test 2: Fallback NIK kosong / null
  assert.strictEqual(maskNik(null), "-")
  assert.strictEqual(maskNik(""), "-")

  // Test 3: Penyamaran Nomor Handphone / WhatsApp
  const phone = "081234567890"
  const maskedPhone = maskPhone(phone)
  assert.strictEqual(
    maskedPhone,
    "0812****7890",
    "Nomor telepon harus menyamarkan 4 digit tengah"
  )

  // Test 4: Fallback telepon kosong / null
  assert.strictEqual(maskPhone(null), "-")
  assert.strictEqual(maskPhone(""), "-")

  // Test 5: Penyamaran Alamat Email PII
  const email = "ahmad.fauzi@med.unhas.ac.id"
  const maskedEmail = maskEmail(email)
  assert.strictEqual(
    maskedEmail,
    "ah***zi@med.unhas.ac.id",
    "Email harus menyamarkan bagian username"
  )

  // Test 6: Sanitasi XSS Injection (Cross-Site Scripting Protection)
  const maliciousInput1 = "<script>alert('XSS-HACKED')</script>Andi Rezky"
  const sanitized1 = sanitizeInput(maliciousInput1)
  assert.strictEqual(sanitized1, "Andi Rezky", "Script tags harus dibersihkan")

  const maliciousInput2 = `<img src="x" onerror="stealCookies()"/>Dr. Budi`
  const sanitized2 = sanitizeInput(maliciousInput2)
  assert.strictEqual(sanitized2, "Dr. Budi", "HTML event handler injection harus dibersihkan")

  const maliciousInput3 = `javascript:void(0)`
  const sanitized3 = sanitizeInput(maliciousInput3)
  assert.strictEqual(sanitized3, "void(0)", "Skema javascript: harus dihapus")

  console.log("  ✔ Semua pengujian privasi UU PDP dan sanitasi input lulus (6/6).");
}
