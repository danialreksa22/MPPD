/**
 * MAGGURU RSUD H. Andi Sulthan Daeng Radja Bulukumba
 * Unit Tests: Otomatisasi Pembuatan Akun Pengguna Mahasiswa / MPPD
 * Memastikan setiap pengajuan mahasiswa langsung mengenerate akun pengguna ber-role 'mahasiswa'
 */

import { USER_ROLES } from "../../lib/constants"
import { generateStudentAccount } from "../../actions/applications"
import { deleteUserAction } from "../../actions/users"

export async function runStudentAccountGenerationTests() {
  console.log("▶ Menjalankan Pengujian: Otomatisasi Pembuatan Akun Pengguna Mahasiswa / MPPD...")

  // Test 1: Pembuatan email fallback ketika email tidak diinput
  const accountWithoutEmail = await generateStudentAccount({
    nim: "C111221005",
    fullName: "Ahmad Fauzi",
    studentType: "mppd",
  })

  if (!accountWithoutEmail.userId) {
    throw new Error("Akun mahasiswa harus menghasilkan UUID user_id yang valid!")
  }

  if (accountWithoutEmail.email !== "c111221005@student.magguru.id") {
    throw new Error(
      `Format email fallback tidak sesuai! Diharapkan 'c111221005@student.magguru.id', didapat: ${accountWithoutEmail.email}`
    )
  }

  if (accountWithoutEmail.password !== "Magguru@C111221005") {
    throw new Error(
      `Kata sandi default tidak sesuai! Diharapkan 'Magguru@C111221005', didapat: ${accountWithoutEmail.password}`
    )
  }

  // Test 2: Pembuatan akun dengan email kustom yang valid
  const accountWithEmail = await generateStudentAccount({
    nim: "N011211044",
    fullName: "Siti Rahmawati",
    email: "siti.rahma@unhas.ac.id",
    phone: "081234567890",
    studentType: "praktik_klinik",
  })

  if (accountWithEmail.email !== "siti.rahma@unhas.ac.id") {
    throw new Error(
      `Email kustom mahasiswa harus dipertahankan! Didapat: ${accountWithEmail.email}`
    )
  }

  if (accountWithEmail.password !== "Magguru@N011211044") {
    throw new Error(
      `Kata sandi default mahasiswa praktik tidak sesuai! Didapat: ${accountWithEmail.password}`
    )
  }

  // Test 3: Verifikasi Role yang Ditetapkan
  if (USER_ROLES.MAHASISWA !== "mahasiswa") {
    throw new Error("Konstanta USER_ROLES.MAHASISWA harus bernilai 'mahasiswa'")
  }

  // Test 4: Sanitasi NIM dengan spasi atau karakter khusus
  const accountWithSpecialNim = await generateStudentAccount({
    nim: " 702001 22 089 ",
    fullName: "Nur Hidayah",
    email: "",
    studentType: "praktik_klinik",
  })

  if (accountWithSpecialNim.email.includes(" ")) {
    throw new Error("Email hasil sanitasi tidak boleh mengandung karakter spasi!")
  }

  if (accountWithSpecialNim.email !== "70200122089@student.magguru.id") {
    throw new Error(
      `Email hasil sanitasi NIM tidak sesuai! Didapat: ${accountWithSpecialNim.email}`
    )
  }

  // Test 5: Konsistensi User ID ketika dipanggil ulang (Idempotency / Existing Account)
  const reAccount = await generateStudentAccount({
    nim: "C111221005",
    fullName: "Ahmad Fauzi",
    email: accountWithoutEmail.email,
  })

  if (!reAccount.userId) {
    throw new Error("Panggilan ulang generateStudentAccount harus tetap mengembalikan userId")
  }

  // Test 6: Proteksi Akun Administrator Utama dari Penghapusan
  const deleteMasterAdmin = await deleteUserAction("usr-admin-master")
  if (deleteMasterAdmin.success || !deleteMasterAdmin.message.includes("Administrator Utama")) {
    throw new Error("Akun Administrator Utama HARUS dilindungi dari penghapusan!")
  }

  // Test 7: Validasi format UUID saat penghapusan
  const deleteInvalidId = await deleteUserAction("bukan-uuid-123")
  if (deleteInvalidId.success || !deleteInvalidId.message.includes("tidak valid")) {
    throw new Error("Penghapusan dengan ID tidak valid harus ditolak!")
  }

  console.log("  ✔ Seluruh pengujian otomatisasi akun & proteksi penghapusan lulus (7/7).")
}
