import assert from "node:assert"
import {
  positionSchema,
  DEFAULT_POSITIONS,
} from "@/lib/validations/positions"

export async function runPositionTests() {
  console.log("▶ Menjalankan Pengujian: Master Data Jabatan Rumah Sakit RSUD Bulukumba...")

  // Test 1: Validasi Skema Zod untuk Jabatan Valid
  const validData = {
    name: "Ketua Komite Mutu & Keselamatan Pasien",
    code: "KMKP",
    category: "fungsional",
    level: "manajemen",
    description: "Koordinator evaluasi keselamatan pasien dan akreditasi mutu rumah sakit.",
    is_active: true,
  }
  const parseValid = positionSchema.safeParse(validData)
  assert.strictEqual(parseValid.success, true, "Data jabatan valid harus lolos validasi Zod")

  // Test 2: Validasi Penolakan Skema jika Nama Kosong atau Terlalu Pendek
  const invalidName = positionSchema.safeParse({
    name: "X", // kurang dari 3 karakter
    code: "XX",
    category: "pelayanan",
    level: "pelaksana",
  })
  assert.strictEqual(invalidName.success, false, "Nama jabatan kurang dari 3 karakter harus ditolak")

  // Test 3: Validasi Penolakan Kategori atau Level Tidak Valid
  const invalidCategory = positionSchema.safeParse({
    name: "Kepala Ruangan ICU",
    code: "KARU_ICU",
    category: "kategori_palsu", // invalid
    level: "pelaksana",
  })
  assert.strictEqual(invalidCategory.success, false, "Kategori jabatan tidak valid harus ditolak")

  const invalidLevel = positionSchema.safeParse({
    name: "Kepala Ruangan ICU",
    code: "KARU_ICU",
    category: "pelayanan",
    level: "level_salah", // invalid
  })
  assert.strictEqual(invalidLevel.success, false, "Tingkat level jabatan tidak valid harus ditolak")

  // Test 4: Default Values (is_active default ke true)
  const defaultValuesTest = positionSchema.safeParse({
    name: "Supervisor Keperawatan Malam",
    code: "SPV_MALAM",
    category: "pelayanan",
    level: "manajemen",
  })
  assert.strictEqual(defaultValuesTest.success, true)
  if (defaultValuesTest.success) {
    assert.strictEqual(defaultValuesTest.data.is_active, true, "Default is_active harus bernilai true")
  }

  // Test 5: Konsistensi Katalog Standar Jabatan RSUD & Komkordik Bulukumba
  assert.strictEqual(DEFAULT_POSITIONS.length, 8, "Standar katalog harus memuat 8 jabatan RSUD")
  const karu = DEFAULT_POSITIONS.find((p) => p.code === "KARU")
  assert.ok(karu, "Katalog harus memuat jabatan KARU")
  assert.strictEqual(karu.category, "pelayanan")

  const komkordik = DEFAULT_POSITIONS.find((p) => p.code === "KETUA_KOMKORDIK")
  assert.ok(komkordik, "Katalog harus memuat jabatan KETUA_KOMKORDIK")
  assert.strictEqual(komkordik.category, "pendidikan")

  const ci = DEFAULT_POSITIONS.find((p) => p.code === "PRESEPTOR_CI")
  assert.ok(ci, "Katalog harus memuat jabatan PRESEPTOR_CI")
  assert.strictEqual(ci.level, "pendidik")

  console.log("  ✔ Seluruh pengujian skema, katalog, dan validasi jabatan lulus (5/5).")
}
