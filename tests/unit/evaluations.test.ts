/**
 * MAGGURU RSUD H. Andi Sulthan Daeng Radja Bulukumba
 * Unit Tests: Modul Kuesioner Evaluasi Stase & Survei Kepuasan 360° (Komkordik)
 */

import {
  staseEvaluationFormSchema,
  calculateOverallEvaluationScore,
  EVALUATION_ASPECTS,
} from "../../lib/validations/evaluations"

export async function runEvaluationTests() {
  console.log("▶ Menjalankan Pengujian: Kuesioner Evaluasi Stase & Survei Mutu 360°...")

  // Test 1: Evaluasi Aspek Standar Komkordik Harus Tepat 4 Aspek
  if (EVALUATION_ASPECTS.length !== 4) {
    throw new Error("Standar Komkordik harus memiliki tepat 4 pilar aspek evaluasi mutu")
  }

  // Test 2: Kalkulasi Skor Indeks Rata-rata
  const score = calculateOverallEvaluationScore(5, 4, 4, 5)
  if (score !== 4.5) {
    throw new Error(`Kalkulasi skor rata-rata salah. Diharapkan 4.5, didapat ${score}`)
  }

  // Test 3: Validasi Skema Evaluasi Stase Mahasiswa
  const validEval = {
    placement_id: "placement-123",
    student_id: "student-456",
    room_id: "room-789",
    preceptor_id: "preceptor-001",
    aspect_teaching_score: 5,
    aspect_facilities_score: 4,
    aspect_cases_score: 5,
    aspect_safety_score: 5,
    strengths: "Pembimbing sangat ramah dan sabar",
    suggestions: "Tambah persediaan handrub di dekat bed pasien",
    is_anonymous: true,
  }

  const parseEval = staseEvaluationFormSchema.safeParse(validEval)
  if (!parseEval.success) {
    throw new Error(`Skema kuesioner evaluasi gagal diparse: ${JSON.stringify(parseEval.error)}`)
  }

  // Test 4: Skor di Luar Rentang 1-5 Harus Ditolak
  const invalidScoreEval = { ...validEval, aspect_teaching_score: 6 }
  if (staseEvaluationFormSchema.safeParse(invalidScoreEval).success) {
    throw new Error("Skema evaluasi harus menolak skor melebihi 5")
  }

  const zeroScoreEval = { ...validEval, aspect_facilities_score: 0 }
  if (staseEvaluationFormSchema.safeParse(zeroScoreEval).success) {
    throw new Error("Skema evaluasi harus menolak skor kurang dari 1")
  }

  // Test 5: Default Anonimitas Harus Aktif Demi Integritas Data
  const evalWithoutAnon = {
    placement_id: "placement-123",
    student_id: "student-456",
    room_id: "room-789",
    aspect_teaching_score: 4,
    aspect_facilities_score: 4,
    aspect_cases_score: 4,
    aspect_safety_score: 4,
  }
  const parsedAnon = staseEvaluationFormSchema.parse(evalWithoutAnon)
  if (parsedAnon.is_anonymous !== true) {
    throw new Error("Evaluasi harus otomatis bernilai anonim (true) secara default")
  }

  console.log("  ✔ Seluruh pengujian skema dan kalkulasi evaluasi stase lulus (5/5).")
}
