"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import {
  assessmentFormSchema,
  finalizeAssessmentSchema,
  AssessmentFormInput,
} from "@/lib/validations/assessments"
import {
  calculateFinalScore,
  calculateGradeLetter,
  USER_ROLES,
} from "@/lib/constants"
import { getCurrentUser } from "@/lib/auth"
import { recordAuditLog } from "@/lib/audit/logger"

export interface AssessmentActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface AssessmentWithRelations {
  id: string
  student_id: string
  placement_id: string
  evaluator_id: string
  score_clinical_skills: number | null
  score_attitude: number | null
  score_knowledge: number | null
  final_score: number | null
  grade_letter: string | null
  feedback: string | null
  assessment_date: string
  is_finalized: boolean
  rubric_detail?: Record<string, unknown> | null
  rubric_template?: string | null
  created_at: string
  updated_at: string
  students?: {
    id: string
    nim: string
    full_name: string
    gender: string
    institutions?: { id: string; name: string } | null
    study_programs?: { id: string; name: string; degree: string } | null
  } | null
  placements?: {
    id: string
    rotation_order: number
    start_date: string
    end_date: string
    room_id: string
    rooms_units?: { id: string; name: string; code: string } | null
    preceptors?: { id: string; name: string; specialization: string | null; nip: string | null } | null
  } | null
  evaluator?: {
    id: string
    full_name: string
    email: string
  } | null
}

export interface EligiblePlacementItem {
  id: string
  student_id: string
  student_name: string
  student_nim: string
  institution_name: string
  study_program_name: string
  room_id: string
  room_name: string
  rotation_order: number
  start_date: string
  end_date: string
  preceptor_id: string | null
  preceptor_name: string | null
  existing_assessment_id: string | null
  is_finalized: boolean
}

/**
 * Mengambil seluruh daftar evaluasi & penilaian klinik
 */
export async function getAssessmentsAction(filters?: {
  roomId?: string
  studyProgramId?: string
  isFinalized?: boolean
  search?: string
}): Promise<AssessmentActionResult<AssessmentWithRelations[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("assessments")
      .select(
        `
        id,
        student_id,
        placement_id,
        evaluator_id,
        score_clinical_skills,
        score_attitude,
        score_knowledge,
        final_score,
        grade_letter,
        feedback,
        assessment_date,
        is_finalized,
        created_at,
        updated_at,
        students (
          id,
          nim,
          full_name,
          gender,
          institutions (id, name),
          study_programs (id, name, degree)
        ),
        placements (
          id,
          rotation_order,
          start_date,
          end_date,
          room_id,
          rooms_units (id, name, code),
          preceptors (id, name, specialization, nip)
        ),
        evaluator:profiles!assessments_evaluator_id_fkey (id, full_name, email)
      `
      )
      .order("created_at", { ascending: false })

    if (filters?.isFinalized !== undefined) {
      query = query.eq("is_finalized", filters.isFinalized)
    }

    const { data, error } = await query
    if (error) throw error

    let list = (data as unknown as AssessmentWithRelations[]) || []

    // Filter in-memory untuk relasi jika diberikan filter roomId atau studyProgramId
    if (filters?.roomId && filters.roomId !== "all") {
      list = list.filter((a) => a.placements?.room_id === filters.roomId)
    }

    if (filters?.studyProgramId && filters.studyProgramId !== "all") {
      list = list.filter((a) => a.students?.study_programs?.id === filters.studyProgramId)
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (a) =>
          a.students?.full_name?.toLowerCase().includes(q) ||
          a.students?.nim?.toLowerCase().includes(q) ||
          a.placements?.rooms_units?.name?.toLowerCase().includes(q)
      )
    }

    return {
      success: true,
      message: "Berhasil memuat data penilaian klinik",
      data: list,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat penilaian klinik"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Mengambil daftar mahasiswa stase aktif/selesai yang dapat dinilai
 */
export async function getEligiblePlacementsForAssessmentAction(): Promise<
  AssessmentActionResult<EligiblePlacementItem[]>
> {
  try {
    const supabase = await createClient()

    // 1. Ambil penempatan
    const { data: placements, error: plError } = await supabase
      .from("placements")
      .select(
        `
        id,
        student_id,
        room_id,
        rotation_order,
        start_date,
        end_date,
        preceptor_id,
        status,
        students (
          id,
          nim,
          full_name,
          institutions (name),
          study_programs (name)
        ),
        rooms_units (id, name),
        preceptors (id, name)
      `
      )
      .in("status", ["active", "completed", "scheduled"])
      .order("start_date", { ascending: false })

    if (plError) throw plError

    // 2. Ambil seluruh penilaian yang sudah ada untuk menandai mana yang sudah ada nilainya
    const { data: assessments } = await supabase
      .from("assessments")
      .select("id, placement_id, is_finalized")

    const assessmentMap = new Map<string, { id: string; is_finalized: boolean }>()
    assessments?.forEach((a) => {
      assessmentMap.set(a.placement_id, { id: a.id, is_finalized: a.is_finalized })
    })

    const items: EligiblePlacementItem[] = (placements || []).map((p) => {
      const student = p.students as unknown as {
        nim: string
        full_name: string
        institutions: { name: string } | null
        study_programs: { name: string } | null
      } | null
      const room = p.rooms_units as unknown as { name: string } | null
      const preceptor = p.preceptors as unknown as { name: string } | null
      const existing = assessmentMap.get(p.id)

      return {
        id: p.id,
        student_id: p.student_id,
        student_name: student?.full_name || "Mahasiswa",
        student_nim: student?.nim || "-",
        institution_name: student?.institutions?.name || "Institusi",
        study_program_name: student?.study_programs?.name || "Program Studi",
        room_id: p.room_id,
        room_name: room?.name || "Ruangan",
        rotation_order: p.rotation_order,
        start_date: p.start_date,
        end_date: p.end_date,
        preceptor_id: p.preceptor_id,
        preceptor_name: preceptor?.name || null,
        existing_assessment_id: existing?.id || null,
        is_finalized: existing?.is_finalized || false,
      }
    })

    return {
      success: true,
      message: "Berhasil memuat daftar kandidat penilaian",
      data: items,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat kandidat penilaian"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Menyimpan penilaian klinik (Draf atau Final)
 */
export async function saveAssessmentAction(
  rawInput: AssessmentFormInput
): Promise<AssessmentActionResult<{ id: string; finalScore: number; gradeLetter: string }>> {
  const validation = assessmentFormSchema.safeParse(rawInput)

  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Input penilaian tidak valid"
    return { success: false, message: firstError }
  }

  const currentUser = await getCurrentUser()
  if (currentUser?.role === USER_ROLES.MAHASISWA) {
    return {
      success: false,
      message: "Akses ditolak: Mahasiswa tidak memiliki izin untuk menginput atau mengubah nilai klinik.",
    }
  }

  const {
    id,
    placement_id,
    student_id,
    score_clinical_skills,
    score_attitude,
    score_knowledge,
    feedback,
    assessment_date,
    is_finalized,
  } = validation.data

  try {
    const supabase = await createClient()

    // 1. Hitung skor akhir & huruf mutu secara akurat
    const finalScore = calculateFinalScore(
      score_clinical_skills,
      score_attitude,
      score_knowledge
    )
    const gradeScale = calculateGradeLetter(finalScore)

    // 2. Tentukan Evaluator ID
    let evaluatorId = validation.data.evaluator_id

    if (!evaluatorId) {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser?.id) {
        evaluatorId = authUser.id
      } else {
        // Cek sesi demo dari cookie
        const cookieStore = await cookies()
        const demoRaw =
          cookieStore.get("magguru_demo_session")?.value ||
          cookieStore.get("simahklin_demo_session")?.value
        if (demoRaw) {
          try {
            const demoUser = JSON.parse(demoRaw)
            // Cari profil berdasarkan email demo
            const { data: demoProfile } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", demoUser.email)
              .maybeSingle()

            if (demoProfile) {
              evaluatorId = demoProfile.id
            }
          } catch {
            // Abaikan error parsing
          }
        }

        // Fallback jika belum terisi: cari profil admin/preseptor pertama
        if (!evaluatorId) {
          const { data: fallbackProfile } = await supabase
            .from("profiles")
            .select("id")
            .limit(1)
            .single()

          evaluatorId = fallbackProfile?.id
        }
      }
    }

    if (!evaluatorId) {
      return { success: false, message: "ID pembimbing penilai tidak dapat diidentifikasi" }
    }

    // 3. Cek apakah assessment sudah ada dan sudah difinalisasi
    if (id) {
      const { data: existingAssessment } = await supabase
        .from("assessments")
        .select("is_finalized")
        .eq("id", id)
        .single()

      if (existingAssessment?.is_finalized && !is_finalized) {
        return {
          success: false,
          message: "Penilaian yang telah difinalisasi tidak dapat diubah kembali menjadi draf.",
        }
      }
    }

    // 4. Upsert Data
    const payload = {
      ...(id ? { id } : {}),
      student_id,
      placement_id,
      evaluator_id: evaluatorId,
      score_clinical_skills,
      score_attitude,
      score_knowledge,
      final_score: finalScore,
      grade_letter: gradeScale.letter,
      feedback: feedback || null,
      assessment_date,
      is_finalized,
    }

    const { data: saved, error: saveError } = await supabase
      .from("assessments")
      .upsert(payload, { onConflict: "student_id,placement_id" })
      .select("id")
      .single()

    if (saveError) throw saveError

    // 5. Jika difinalisasi, tandai stase penempatan menjadi 'completed' jika masih 'active'
    if (is_finalized) {
      await supabase
        .from("placements")
        .update({ status: "completed" })
        .eq("id", placement_id)
        .eq("status", "active")
    }

    await recordAuditLog({
      userId: evaluatorId,
      action: is_finalized ? "FINALIZE" : (id ? "UPDATE" : "CREATE"),
      entity: "assessments",
      recordId: saved.id,
      newValues: {
        student_id,
        placement_id,
        final_score: finalScore,
        grade_letter: gradeScale.letter,
        is_finalized,
      },
    })

    revalidatePath("/dashboard/penilaian")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: is_finalized
        ? `Penilaian berhasil difinalisasi! Nilai Akhir: ${finalScore} (Mutu ${gradeScale.letter})`
        : "Draf penilaian berhasil disimpan.",
      data: {
        id: saved.id,
        finalScore,
        gradeLetter: gradeScale.letter,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan penilaian"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Finalisasi (Kunci) Penilaian Stase
 */
export async function finalizeAssessmentAction(
  assessmentId: string
): Promise<AssessmentActionResult> {
  const validation = finalizeAssessmentSchema.safeParse({ id: assessmentId })

  if (!validation.success) {
    return { success: false, message: "ID penilaian tidak valid" }
  }

  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === USER_ROLES.MAHASISWA) {
      return {
        success: false,
        message: "Akses ditolak: Mahasiswa tidak memiliki izin untuk memfinalisasi nilai klinik.",
      }
    }

    const supabase = await createClient()

    // Ambil data placement_id
    const { data: assessment, error: fetchErr } = await supabase
      .from("assessments")
      .select("id, placement_id, final_score, grade_letter")
      .eq("id", validation.data.id)
      .single()

    if (fetchErr || !assessment) {
      return { success: false, message: "Data penilaian tidak ditemukan" }
    }

    // Update is_finalized = true
    const { error: updateErr } = await supabase
      .from("assessments")
      .update({ is_finalized: true })
      .eq("id", validation.data.id)

    if (updateErr) throw updateErr

    // Update status placement
    if (assessment.placement_id) {
      await supabase
        .from("placements")
        .update({ status: "completed" })
        .eq("id", assessment.placement_id)
        .eq("status", "active")
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    await recordAuditLog({
      userId: user?.id || null,
      action: "FINALIZE",
      entity: "assessments",
      recordId: validation.data.id,
      newValues: {
        is_finalized: true,
        final_score: assessment.final_score,
        grade_letter: assessment.grade_letter,
      },
    })

    revalidatePath("/dashboard/penilaian")
    return {
      success: true,
      message: `Penilaian stase resmi difinalisasi (${assessment.final_score} - Mutu ${assessment.grade_letter})!`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memfinalisasi penilaian"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Menghapus penilaian (Hanya jika belum difinalisasi)
 */
export async function deleteAssessmentAction(
  assessmentId: string
): Promise<AssessmentActionResult> {
  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === USER_ROLES.MAHASISWA) {
      return {
        success: false,
        message: "Akses ditolak: Mahasiswa tidak memiliki izin untuk menghapus nilai klinik.",
      }
    }

    const supabase = await createClient()

    // 1. Cek apakah sudah final
    const { data: existing } = await supabase
      .from("assessments")
      .select("is_finalized, student_id, placement_id")
      .eq("id", assessmentId)
      .single()

    if (existing?.is_finalized) {
      return {
        success: false,
        message: "Penilaian yang telah difinalisasi tidak dapat dihapus demi integritas data akademik.",
      }
    }

    const { error } = await supabase
      .from("assessments")
      .delete()
      .eq("id", assessmentId)

    if (error) throw error

    const {
      data: { user },
    } = await supabase.auth.getUser()

    await recordAuditLog({
      userId: user?.id || null,
      action: "DELETE",
      entity: "assessments",
      recordId: assessmentId,
      oldValues: existing,
    })

    revalidatePath("/dashboard/penilaian")
    return { success: true, message: "Draf penilaian berhasil dihapus" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus penilaian"
    return { success: false, message, error: String(err) }
  }
}
