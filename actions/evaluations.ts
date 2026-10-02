"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { USER_ROLES } from "@/lib/constants"
import { recordAuditLog } from "@/lib/audit/logger"
import {
  staseEvaluationFormSchema,
  calculateOverallEvaluationScore,
  StaseEvaluationFormInput,
} from "@/lib/validations/evaluations"

async function getDbClient() {
  try {
    return createAdminClient()
  } catch {
    return await createClient()
  }
}

export interface StaseEvaluationWithRelations {
  id: string
  placement_id: string
  student_id: string
  room_id: string
  preceptor_id: string | null
  aspect_teaching_score: number
  aspect_facilities_score: number
  aspect_cases_score: number
  aspect_safety_score: number
  overall_score: number
  strengths: string | null
  suggestions: string | null
  is_anonymous: boolean
  created_at: string
  rooms_units?: {
    id: string
    name: string
    code: string
  } | null
  preceptors?: {
    id: string
    name: string
  } | null
  students?: {
    id: string
    nim: string
    full_name: string
    institutions?: { name: string } | null
    study_programs?: { name: string } | null
  } | null
  placements?: {
    id: string
    rotation_order: number
    start_date: string
    end_date: string
  } | null
}

export interface EvaluationActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

/**
 * Mengambil seluruh data evaluasi stase untuk dashboard analitik Komkordik/Diklat
 */
export async function getStaseEvaluationsAction(filters?: {
  roomId?: string
  studentId?: string
}): Promise<EvaluationActionResult<StaseEvaluationWithRelations[]>> {
  try {
    const supabase = await getDbClient()

    let query = supabase
      .from("stase_evaluations")
      .select(
        `
        id,
        placement_id,
        student_id,
        room_id,
        preceptor_id,
        aspect_teaching_score,
        aspect_facilities_score,
        aspect_cases_score,
        aspect_safety_score,
        overall_score,
        strengths,
        suggestions,
        is_anonymous,
        created_at,
        rooms_units (id, name, code),
        preceptors (id, name),
        students (id, nim, full_name, institutions (name), study_programs (name)),
        placements (id, rotation_order, start_date, end_date)
      `
      )
      .order("created_at", { ascending: false })

    if (filters?.roomId && filters.roomId !== "all") {
      query = query.eq("room_id", filters.roomId)
    }

    if (filters?.studentId) {
      query = query.eq("student_id", filters.studentId)
    }

    const { data, error } = await query

    if (error) {
      console.warn("Gagal mengambil evaluasi dari Supabase", error)
      return { success: true, message: "Belum ada respons evaluasi", data: [] }
    }

    return {
      success: true,
      message: "Berhasil memuat respons evaluasi stase",
      data: (data as unknown as StaseEvaluationWithRelations[]) || [],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat evaluasi stase"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Mengirim kuesioner evaluasi stase oleh mahasiswa
 */
export async function submitStaseEvaluationAction(
  rawInput: StaseEvaluationFormInput
): Promise<EvaluationActionResult<{ id: string }>> {
  const validation = staseEvaluationFormSchema.safeParse(rawInput)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Input evaluasi tidak valid",
    }
  }

  try {
    const supabase = await getDbClient()
    const {
      placement_id,
      student_id,
      room_id,
      preceptor_id,
      aspect_teaching_score,
      aspect_facilities_score,
      aspect_cases_score,
      aspect_safety_score,
      strengths,
      suggestions,
      is_anonymous,
    } = validation.data

    // Cek apakah mahasiswa sudah pernah mengevaluasi penempatan stase ini
    const { data: existing } = await supabase
      .from("stase_evaluations")
      .select("id")
      .eq("placement_id", placement_id)
      .eq("student_id", student_id)
      .maybeSingle()

    if (existing) {
      return {
        success: false,
        message: "Anda telah mengirimkan evaluasi untuk penempatan stase ini sebelumnya.",
      }
    }

    const overallScore = calculateOverallEvaluationScore(
      aspect_teaching_score,
      aspect_facilities_score,
      aspect_cases_score,
      aspect_safety_score
    )

    const payload = {
      placement_id,
      student_id,
      room_id,
      preceptor_id: preceptor_id || null,
      aspect_teaching_score,
      aspect_facilities_score,
      aspect_cases_score,
      aspect_safety_score,
      overall_score: overallScore,
      strengths: strengths || null,
      suggestions: suggestions || null,
      is_anonymous,
    }

    const { data: created, error } = await supabase
      .from("stase_evaluations")
      .insert(payload)
      .select("id")
      .single()

    if (error) throw error

    await recordAuditLog({
      action: "SUBMIT_EVALUATION",
      entity: "stase_evaluations",
      recordId: created.id,
      newValues: {
        room_id,
        overall_score: overallScore,
        is_anonymous,
      },
    })

    revalidatePath("/dashboard/evaluasi")
    revalidatePath("/dashboard")
    return {
      success: true,
      message: `Terima kasih! Kuesioner evaluasi stase berhasil dikirim (Skor Indeks: ${overallScore}/5.0). Masukan Anda sangat berarti bagi peningkatan mutu RSUD Bulukumba.`,
      data: { id: created.id },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengirimkan kuesioner evaluasi"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Menghapus evaluasi stase (Hanya Admin)
 */
export async function deleteStaseEvaluationAction(
  evaluationId: string
): Promise<EvaluationActionResult> {
  const currentUser = await getCurrentUser()
  if (
    currentUser?.role !== USER_ROLES.SUPER_ADMIN &&
    currentUser?.role !== USER_ROLES.ADMIN_DIKLAT
  ) {
    return {
      success: false,
      message: "Akses ditolak: Hanya administrator yang berhak menghapus data evaluasi.",
    }
  }

  try {
    const supabase = await getDbClient()
    const { error } = await supabase
      .from("stase_evaluations")
      .delete()
      .eq("id", evaluationId)

    if (error) throw error

    revalidatePath("/dashboard/evaluasi")
    return { success: true, message: "Respons evaluasi berhasil dihapus" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus evaluasi"
    return { success: false, message, error: String(err) }
  }
}
