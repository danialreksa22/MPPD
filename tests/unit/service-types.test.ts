import assert from "node:assert"
import {
  serviceTypeSchema,
  DEFAULT_SERVICE_TYPES,
} from "@/lib/validations/service-types"

export async function runServiceTypeTests() {
  console.log("▶ Menjalankan Pengujian: Master Data Jenis Pelayanan RSUD Bulukumba...")

  // Test 1: Validasi Skema Zod untuk Jenis Pelayanan Valid
  const validData = {
    name: "Pelayanan Hemodialisa (Cuci Darah)",
    code: "HEMODIALISA",
    category: "khusus",
    description: "Pelayanan terapi pengganti ginjal dan cuci darah terpadu.",
    color: "rose",
    is_active: true,
  }
  const parseValid = serviceTypeSchema.safeParse(validData)
  assert.strictEqual(parseValid.success, true, "Data jenis pelayanan valid harus lolos validasi Zod")

  // Test 2: Validasi Penolakan Skema jika Nama Kosong atau Terlalu Pendek
  const invalidName = serviceTypeSchema.safeParse({
    name: "AB", // kurang dari 3 karakter
    code: "HD",
    category: "medis",
  })
  assert.strictEqual(invalidName.success, false, "Nama jenis pelayanan kurang dari 3 karakter harus ditolak")

  // Test 3: Validasi Penolakan Kategori Tidak Valid
  const invalidCategory = serviceTypeSchema.safeParse({
    name: "Pelayanan Farmasi Klinik",
    code: "FARMASI",
    category: "kategori_ngawur", // bukan salah satu dari enum
  })
  assert.strictEqual(invalidCategory.success, false, "Kategori tidak valid harus ditolak")

  // Test 4: Default Values (color default ke 'sky' dan is_active default ke true)
  const defaultValuesTest = serviceTypeSchema.safeParse({
    name: "Pelayanan Radiologi & CT-Scan",
    code: "RADIOLOGI",
    category: "penunjang",
  })
  assert.strictEqual(defaultValuesTest.success, true)
  if (defaultValuesTest.success) {
    assert.strictEqual(defaultValuesTest.data.color, "sky", "Default color harus bernilai 'sky'")
    assert.strictEqual(defaultValuesTest.data.is_active, true, "Default is_active harus bernilai true")
  }

  // Test 5: Konsistensi Katalog Standar RSUD Bulukumba
  assert.strictEqual(DEFAULT_SERVICE_TYPES.length, 7, "Standar katalog harus memuat 7 jenis pelayanan RSUD")
  const rawatJalan = DEFAULT_SERVICE_TYPES.find((s) => s.code === "RAWAT_JALAN")
  assert.ok(rawatJalan, "Katalog harus memuat jenis pelayanan RAWAT_JALAN")
  assert.strictEqual(rawatJalan.category, "medis")

  const igd = DEFAULT_SERVICE_TYPES.find((s) => s.code === "IGD")
  assert.ok(igd, "Katalog harus memuat jenis pelayanan IGD")
  assert.strictEqual(igd.category, "intensif")

  console.log("  ✔ Seluruh pengujian skema, katalog, dan validasi jenis pelayanan lulus (5/5).")
}
