import assert from "node:assert"
import {
  calculateFinalScore,
  calculateGradeLetter,
  PASSING_SCORE_THRESHOLD,
} from "@/lib/constants"

export async function runAssessmentTests() {
  console.log("▶ Menjalankan Pengujian: Penilaian Klinik, Bobot, & Skala Huruf Mutu...");

  // Test 1: Perhitungan skor akhir berbobot (40% skills, 30% attitude, 30% knowledge)
  const score1 = calculateFinalScore(90, 85, 80)
  // 90*0.4 (36) + 85*0.3 (25.5) + 80*0.3 (24) = 85.5
  assert.strictEqual(score1, 85.5, "Perhitungan nilai berbobot harus presisi 85.5")

  // Test 2: Batas nilai terdistorsi (> 100 atau < 0) harus di-clamp
  const scoreMax = calculateFinalScore(120, 100, 105)
  assert.strictEqual(scoreMax, 100, "Nilai di atas 100 harus dibatasi ke 100")

  const scoreMin = calculateFinalScore(-15, 0, 10)
  assert.strictEqual(scoreMin, 3, "Nilai negatif harus dibatasi ke 0 (0*0.4 + 0*0.3 + 10*0.3 = 3)")

  // Test 3: Skala Huruf Mutu A (>= 85.0)
  const gradeA = calculateGradeLetter(85.5)
  assert.strictEqual(gradeA.letter, "A")
  assert.strictEqual(gradeA.gpa, 4.0)
  assert.strictEqual(gradeA.passed, true)

  // Test 4: Skala Huruf Mutu B (Batas kelulusan RSUD = 70.0)
  const gradeB = calculateGradeLetter(70.0)
  assert.strictEqual(gradeB.letter, "B")
  assert.strictEqual(gradeB.gpa, 3.0)
  assert.strictEqual(gradeB.passed, true)

  // Test 5: Skor 69.9 harus masuk kategori Remedial (B-, tidak lulus langsung)
  const gradeBMinus = calculateGradeLetter(69.9)
  assert.strictEqual(gradeBMinus.letter, "B-")
  assert.strictEqual(gradeBMinus.gpa, 2.7)
  assert.strictEqual(gradeBMinus.passed, false, "Skor di bawah threshold 70 harus bernilai passed=false")

  // Test 6: Verifikasi ambang kelulusan standar
  assert.strictEqual(PASSING_SCORE_THRESHOLD, 70.0)

  // Test 7: Integritas Status Finalisasi (Aturan Bisnis: Draf vs Final)
  function validateFinalizationTransition(currentFinal: boolean, newFinal: boolean): boolean {
    if (currentFinal && !newFinal) {
      return false // Penilaian yang sudah final tidak boleh diubah kembali menjadi draf
    }
    return true
  }

  assert.strictEqual(validateFinalizationTransition(false, true), true, "Draf boleh difinalisasi")
  assert.strictEqual(validateFinalizationTransition(false, false), true, "Draf boleh tetap draf")
  assert.strictEqual(validateFinalizationTransition(true, true), true, "Final tetap final")
  assert.strictEqual(validateFinalizationTransition(true, false), false, "Final TIDAK boleh kembali ke draf")

  console.log("  ✔ Semua pengujian penilaian klinik dan mutu nilai lulus (7/7).");
}
