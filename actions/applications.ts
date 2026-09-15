"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { uploadStudentDocument } from "@/lib/supabase/storage"
import {
  individualApplicationSchema,
  applicationStatusUpdateSchema,
} from "@/lib/validations/applications"
import { recordAuditLog } from "@/lib/audit/logger"

export interface ApplicationActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

/**
 * Generate nomor registrasi pengajuan resmi (contoh: REG/202609/1402)
 */
function generateApplicationNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  return `REG/${year}${month}/${randomSuffix}`
}

/**
 * Mengambil daftar pengajuan mahasiswa dengan filter
 */
export async function getApplicationsAction(
  statusFilter?: string
): Promise<ApplicationActionResult<unknown[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("student_applications")
      .select(
        `
        *,
        institutions (id, name, type),
        periods (id, name, start_date, end_date, academic_year),
        student_documents (id, document_type, verified_status)
      `
      )
      .order("created_at", { ascending: false })

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    const { data, error } = await query
    if (error) throw error

    return {
      success: true,
      message: "Berhasil mengambil daftar pengajuan",
      data: data || [],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil daftar pengajuan"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Mengambil detail pengajuan berdasarkan ID
 */
export async function getApplicationDetailAction(
  id: string
): Promise<ApplicationActionResult<{ application: Record<string, unknown>; student: Record<string, unknown> | null }>> {
  try {
    const supabase = await createClient()

    const { data: application, error: appError } = await supabase
      .from("student_applications")
      .select(
        `
        *,
        institutions (*),
        periods (*),
        student_documents (*)
      `
      )
      .eq("id", id)
      .single()

    if (appError) throw appError

    // Ambil data mahasiswa yang terkait dengan pengajuan ini
    // (Bisa melalui student_documents atau placements atau mahasiswa pertama dari institusi terkait)
    let student = null
    if (application.student_documents && application.student_documents.length > 0) {
      const firstStudentId = application.student_documents[0].student_id
      const { data: studentData } = await supabase
        .from("students")
        .select("*, study_programs(*)")
        .eq("id", firstStudentId)
        .single()

      student = studentData
    }

    return {
      success: true,
      message: "Berhasil mengambil detail pengajuan",
      data: {
        application,
        student,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil detail pengajuan"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Pengajuan Mahasiswa Baru Secara Individu
 */
export async function createIndividualApplicationAction(
  formData: FormData
): Promise<ApplicationActionResult<{ applicationId: string; applicationNumber: string }>> {
  const rawData = {
    institution_id: formData.get("institution_id") as string,
    period_id: formData.get("period_id") as string,
    study_program_id: formData.get("study_program_id") as string,
    type: (formData.get("type") as "praktik_klinik" | "mppd") || "praktik_klinik",
    nim: formData.get("nim") as string,
    nik: (formData.get("nik") as string) || "",
    full_name: formData.get("full_name") as string,
    gender: (formData.get("gender") as "L" | "P") || "L",
    phone: (formData.get("phone") as string) || "",
    email: (formData.get("email") as string) || "",
    desired_room_id: (formData.get("desired_room_id") as string) || "",
    notes: (formData.get("notes") as string) || "",
  }

  const validation = individualApplicationSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data formulir tidak valid",
    }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 1. Simpan atau perbarui data mahasiswa di tabel students
    const studentPayload = {
      institution_id: validation.data.institution_id,
      study_program_id: validation.data.study_program_id,
      type: validation.data.type,
      nim: validation.data.nim,
      nik: validation.data.nik || null,
      full_name: validation.data.full_name,
      gender: validation.data.gender,
      phone: validation.data.phone || null,
      email: validation.data.email || null,
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .upsert(studentPayload, { onConflict: "institution_id, nim" })
      .select()
      .single()

    if (studentError) throw studentError

    // 2. Buat berkas pengajuan di student_applications
    const appNumber = generateApplicationNumber()
    const submittedById = user?.id || student.id // Fallback ID jika demo

    const { data: application, error: appError } = await supabase
      .from("student_applications")
      .insert({
        application_number: appNumber,
        institution_id: validation.data.institution_id,
        period_id: validation.data.period_id,
        status: "diajukan",
        notes: validation.data.notes || null,
        submitted_by_id: submittedById,
      })
      .select()
      .single()

    if (appError) throw appError

    await recordAuditLog({
      action: "CREATE",
      entity: "student_applications",
      recordId: application.id,
      newValues: {
        application_number: appNumber,
        student_id: student.id,
        institution_id: validation.data.institution_id,
        period_id: validation.data.period_id,
      },
    })

    // 3. Tangani unggahan dokumen pendukung ke Supabase Storage
    const documentKeys = [
      { key: "doc_surat_pengantar", type: "Surat Pengantar Institusi" },
      { key: "doc_ktp_ktm", type: "KTP / KTM" },
      { key: "doc_pas_foto", type: "Pas Foto Resmi" },
      { key: "doc_vaksin", type: "Sertifikat Vaksin" },
      { key: "doc_asuransi", type: "Asuransi Kesehatan / BPJS" },
    ]

    for (const doc of documentKeys) {
      const file = formData.get(doc.key) as File | null
      if (file && file.size > 0) {
        const fileExt = file.name.split(".").pop() || "pdf"
        const storagePath = `${application.id}/${student.id}_${doc.key}_${Date.now()}.${fileExt}`

        const uploadRes = await uploadStudentDocument(file, storagePath)
        const fileUrl = uploadRes.url || storagePath

        await supabase.from("student_documents").insert({
          student_id: student.id,
          application_id: application.id,
          document_type: doc.type,
          file_name: file.name,
          file_url: fileUrl,
          file_size: file.size,
          verified_status: "pending",
        })
      }
    }

    revalidatePath("/dashboard/pengajuan")
    return {
      success: true,
      message: `Pengajuan berhasil dikirimkan dengan nomor registrasi: ${appNumber}`,
      data: {
        applicationId: application.id,
        applicationNumber: appNumber,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan berkas pengajuan"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Pengajuan Mahasiswa Kolektif (Bulk Import Excel / CSV)
 */
export async function createBulkApplicationAction(
  institutionId: string,
  periodId: string,
  studyProgramId: string,
  type: "praktik_klinik" | "mppd",
  studentsJson: string,
  notes?: string
): Promise<ApplicationActionResult<{ applicationId: string; totalStudents: number }>> {
  try {
    const studentsData: Array<{
      nim: string
      nik?: string
      full_name: string
      gender: string
      phone?: string
      email?: string
    }> = JSON.parse(studentsJson)
    if (!studentsData || studentsData.length === 0) {
      return { success: false, message: "Daftar mahasiswa kosong" }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const appNumber = generateApplicationNumber()
    const submittedById = user?.id || institutionId

    // 1. Buat pengajuan kolektif
    const { data: application, error: appError } = await supabase
      .from("student_applications")
      .insert({
        application_number: appNumber,
        institution_id: institutionId,
        period_id: periodId,
        status: "diajukan",
        notes: `Pengajuan kolektif ${studentsData.length} mahasiswa. ${notes || ""}`,
        submitted_by_id: submittedById,
      })
      .select()
      .single()

    if (appError) throw appError

    // 2. Simpan setiap mahasiswa ke database
    for (const s of studentsData) {
      const studentPayload = {
        institution_id: institutionId,
        study_program_id: studyProgramId,
        type: type,
        nim: String(s.nim || "").trim(),
        nik: s.nik ? String(s.nik).trim() : null,
        full_name: String(s.full_name || "").trim(),
        gender: (String(s.gender || "L").toUpperCase() === "P" ? "P" : "L") as "L" | "P",
        phone: s.phone ? String(s.phone).trim() : null,
        email: s.email ? String(s.email).trim() : null,
      }

      const { data: createdStudent } = await supabase
        .from("students")
        .upsert(studentPayload, { onConflict: "institution_id, nim" })
        .select("id")
        .single()

      if (createdStudent) {
        // Catat referensi ke pengajuan
        await supabase.from("student_documents").insert({
          student_id: createdStudent.id,
          application_id: application.id,
          document_type: "Berkas Kolektif Excel",
          file_name: `Mahasiswa_${s.nim}_${s.full_name}`,
          file_url: "kolektif",
          file_size: 0,
          verified_status: "pending",
        })
      }
    }

    await recordAuditLog({
      action: "CREATE",
      entity: "student_applications",
      recordId: application.id,
      newValues: {
        application_number: appNumber,
        total_students: studentsData.length,
        institution_id: institutionId,
        period_id: periodId,
        type,
        notes: `Pengajuan kolektif ${studentsData.length} mahasiswa`,
      },
    })

    revalidatePath("/dashboard/pengajuan")
    return {
      success: true,
      message: `Pengajuan kolektif ${studentsData.length} mahasiswa berhasil dikirimkan (${appNumber})!`,
      data: {
        applicationId: application.id,
        totalStudents: studentsData.length,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memproses pengajuan kolektif"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Verifikasi status dokumen pendukung (Valid / Invalid / Pending)
 */
export async function verifyDocumentAction(
  documentId: string,
  status: "pending" | "valid" | "invalid"
): Promise<ApplicationActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("student_documents")
      .update({
        verified_status: status,
        verified_by_id: user?.id || null,
      })
      .eq("id", documentId)

    if (error) throw error

    revalidatePath("/dashboard/pengajuan")
    return { success: true, message: `Status dokumen berhasil diubah menjadi: ${status}` }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memverifikasi dokumen"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Transisi status pengajuan (Diajukan -> Diverifikasi -> Disetujui / Ditolak)
 */
export async function updateApplicationStatusAction(
  formData: FormData
): Promise<ApplicationActionResult> {
  const rawData = {
    application_id: formData.get("application_id") as string,
    status: formData.get("status") as unknown,
    rejection_reason: (formData.get("rejection_reason") as string) || "",
    notes: (formData.get("notes") as string) || "",
  }

  const validation = applicationStatusUpdateSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Perubahan status tidak valid",
    }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const updatePayload: Record<string, unknown> = {
      status: validation.data.status,
      notes: validation.data.notes || null,
      rejection_reason:
        validation.data.status === "ditolak" ? validation.data.rejection_reason : null,
    }

    if (validation.data.status === "diverifikasi") {
      updatePayload.verified_at = new Date().toISOString()
      updatePayload.verified_by_id = user?.id || null
    } else if (validation.data.status === "disetujui") {
      updatePayload.approved_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("student_applications")
      .update(updatePayload)
      .eq("id", validation.data.application_id)

    if (error) throw error

    await recordAuditLog({
      action:
        validation.data.status === "disetujui"
          ? "APPROVE"
          : validation.data.status === "ditolak"
          ? "REJECT"
          : "UPDATE",
      entity: "student_applications",
      recordId: validation.data.application_id,
      newValues: updatePayload,
      userId: user?.id,
    })

    revalidatePath("/dashboard/pengajuan")
    revalidatePath(`/dashboard/pengajuan/${validation.data.application_id}`)

    const statusLabel =
      validation.data.status === "disetujui"
        ? "disetujui"
        : validation.data.status === "ditolak"
        ? "ditolak"
        : validation.data.status

    return {
      success: true,
      message: `Status pengajuan berhasil diperbarui menjadi: ${statusLabel}`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui status pengajuan"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Pengecekan ketersediaan kuota ruangan pelayanan
 */
export async function getRoomQuotaAvailabilityAction(
  roomId: string,
  periodId: string
): Promise<
  ApplicationActionResult<{
    capacity: number
    occupied: number
    remaining: number
    isAvailable: boolean
  }>
> {
  try {
    const supabase = await createClient()

    // 1. Ambil kapasitas ruangan
    const { data: room, error: roomError } = await supabase
      .from("rooms_units")
      .select("capacity, name")
      .eq("id", roomId)
      .single()

    if (roomError) throw roomError

    // 2. Hitung penempatan mahasiswa aktif pada periode dan ruangan tersebut
    const { count, error: countError } = await supabase
      .from("placements")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId)
      .eq("period_id", periodId)
      .in("status", ["scheduled", "active"])

    if (countError) throw countError

    const capacity = room?.capacity || 0
    const occupied = count || 0
    const remaining = Math.max(0, capacity - occupied)

    return {
      success: true,
      message: `Kuota ruangan ${room.name}: ${occupied}/${capacity} terisi.`,
      data: {
        capacity,
        occupied,
        remaining,
        isAvailable: remaining > 0,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memeriksa kuota ruangan"
    return { success: false, message, error: String(err) }
  }
}
