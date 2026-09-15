/**
 * MAGGURU RSUD Bulukumba — Modul Keamanan & Kepatuhan UU PDP (Perlindungan Data Pribadi)
 * Sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi
 */

/**
 * Menyamarkan Nomor Induk Kependudukan (NIK) mahasiswa
 * Contoh input: "7302011234560001" -> Output: "730201******0001"
 */
export function maskNik(nik?: string | null): string {
  if (!nik) return "-"
  const clean = nik.trim()
  if (clean.length < 10) return clean
  const prefix = clean.slice(0, 6)
  const suffix = clean.slice(-4)
  const maskedLength = Math.max(clean.length - 10, 4)
  return `${prefix}${"*".repeat(maskedLength)}${suffix}`
}

/**
 * Menyamarkan nomor telepon seluler / WhatsApp mahasiswa
 * Contoh input: "081234567890" -> Output: "0812****7890"
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return "-"
  const clean = phone.trim()
  if (clean.length < 8) return clean
  const prefix = clean.slice(0, 4)
  const suffix = clean.slice(-4)
  const maskedLength = Math.max(clean.length - 8, 3)
  return `${prefix}${"*".repeat(maskedLength)}${suffix}`
}

/**
 * Menyamarkan alamat surel (Email)
 * Contoh input: "ahmad.fauzi@med.unhas.ac.id" -> Output: "ah***zi@med.unhas.ac.id"
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes("@")) return email || "-"
  const [username, domain] = email.split("@")
  if (username.length <= 3) {
    return `${username.slice(0, 1)}***@${domain}`
  }
  const prefix = username.slice(0, 2)
  const suffix = username.slice(-2)
  return `${prefix}***${suffix}@${domain}`
}

/**
 * Membersihkan masukan teks bebas dari potensi serangan injeksi XSS (Cross-Site Scripting)
 */
export function sanitizeInput(input?: string | null): string {
  if (!input) return ""
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/javascript:/gi, "")
    .replace(/onerror=/gi, "")
    .replace(/onload=/gi, "")
    .trim()
}
