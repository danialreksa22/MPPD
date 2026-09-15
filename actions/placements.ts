"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  singlePlacementSchema,
  multiRotationScheduleSchema,
  placementStatusSchema,
  MultiRotationScheduleInput,
} from "@/lib/validations/placements"
import { PlacementStatus } from "@/lib/constants"
import { recordAuditLog } from "@/lib/audit/logger"

export interface PlacementActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface PlacementWithRelations {
  id: string
  student_id: string
  application_id: string
  period_id: string
  room_id: string
  preceptor_id: string | null
  rotation_order: number
  start_date: string
  end_date: string
  status: PlacementStatus
  created_at: string
  students?: {
    id: string
    nim: string
    full_name: string
    gender: string
    institutions?: { id: string; name: string } | null
    study_programs?: { id: string; name: string; degree: string } | null
  } | null
  rooms_units?: {
    id: string
    name: string
    code: string
    capacity: number
    service_type: string
    location?: string | null
  } | null
  periods?: {
    id: string
    name: string
    start_date: string
    end_date: string
    academic_year: string
  } | null
  preceptors?: {
    id: string
    name: string
    type: string
    specialization: string
  } | null
  student_applications?: {
    id: string
    application_number: string
    status: string
  } | null
}

export interface EligibleStudent {
  id: string
  nim: string
  full_name: string
  gender: string
  institution_id: string
  study_program_id: string
  application_id: string
  application_number: string
  institution_name: string
  study_program_name: string
}

/**
 * Mengambil daftar penempatan mahasiswa dengan filter
 */
export async function getPlacementsAction(filters?: {
  periodId?: string
  roomId?: string
  studentId?: string
  status?: string
}): Promise<PlacementActionResult<PlacementWithRelations[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("placements")
      .select(
        `
        *,
        students (
          id,
          nim,
          full_name,
          gender,
          institutions (id, name),
          study_programs (id, name, degree)
        ),
        rooms_units (id, name, code, capacity, service_type, location),
        periods (id, name, start_date, end_date, academic_year),
        preceptors (id, name, type, specialization),
        student_applications (id, application_number, status)
      `
      )
      .order("start_date", { ascending: true })
      .order("rotation_order", { ascending: true })

    if (filters?.periodId && filters.periodId !== "all") {
      query = query.eq("period_id", filters.periodId)
    }
    if (filters?.roomId && filters.roomId !== "all") {
      query = query.eq("room_id", filters.roomId)
    }
    if (filters?.studentId) {
      query = query.eq("student_id", filters.studentId)
    }
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    const { data, error } = await query
    if (error) throw error

    return {
      success: true,
      message: "Berhasil mengambil data penempatan",
      data: (data as unknown as PlacementWithRelations[]) || [],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data penempatan"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Mengambil mahasiswa dari pengajuan yang telah disetujui / aktif untuk diplotted
 */
export async function getEligibleStudentsForPlacementAction(
  periodId?: string
): Promise<PlacementActionResult<EligibleStudent[]>> {
  try {
    const supabase = await createClient()

    // 1. Ambil pengajuan yang berstatus disetujui atau aktif
    let appQuery = supabase
      .from("student_applications")
      .select(
        `
        id,
        application_number,
        institution_id,
        period_id,
        institutions (name),
        student_documents (
          student_id,
          students (
            id,
            nim,
            full_name,
            gender,
            institution_id,
            study_program_id,
            study_programs (name)
          )
        )
      `
      )
      .in("status", ["disetujui", "aktif"])

    if (periodId && periodId !== "all") {
      appQuery = appQuery.eq("period_id", periodId)
    }

    const { data: apps, error: appError } = await appQuery
    if (appError) throw appError

    const eligibleMap = new Map<string, EligibleStudent>()

    for (const app of apps || []) {
      const docs = app.student_documents as unknown as Array<{
        student_id: string
        students: {
          id: string
          nim: string
          full_name: string
          gender: string
          institution_id: string
          study_program_id: string
          study_programs: { name: string } | null
        } | null
      }>

      if (docs && docs.length > 0) {
        for (const d of docs) {
          if (d.students && !eligibleMap.has(d.students.id)) {
            const inst = app.institutions as unknown as { name: string } | null
            eligibleMap.set(d.students.id, {
              id: d.students.id,
              nim: d.students.nim,
              full_name: d.students.full_name,
              gender: d.students.gender,
              institution_id: d.students.institution_id,
              study_program_id: d.students.study_program_id,
              application_id: app.id,
              application_number: app.application_number,
              institution_name: inst?.name || "-",
              study_program_name: d.students.study_programs?.name || "-",
            })
          }
        }
      }
    }

    // Jika map masih kosong (misal data diinput langsung di tabel students), ambil juga data students yang ada
    if (eligibleMap.size === 0) {
      const { data: allStudents } = await supabase
        .from("students")
        .select(
          `
          id,
          nim,
          full_name,
          gender,
          institution_id,
          study_program_id,
          institutions (name),
          study_programs (name)
        `
        )
        .limit(50)

      for (const s of allStudents || []) {
        const inst = s.institutions as unknown as { name: string } | null
        const prodi = s.study_programs as unknown as { name: string } | null

        // Cari atau hubungkan ke aplikasi default
        const firstApp = apps?.[0]
        eligibleMap.set(s.id, {
          id: s.id,
          nim: s.nim,
          full_name: s.full_name,
          gender: s.gender,
          institution_id: s.institution_id,
          study_program_id: s.study_program_id,
          application_id: firstApp?.id || "",
          application_number: firstApp?.application_number || "REG-TERDAFTAR",
          institution_name: inst?.name || "-",
          study_program_name: prodi?.name || "-",
        })
      }
    }

    const students = Array.from(eligibleMap.values())

    return {
      success: true,
      message: `Ditemukan ${students.length} mahasiswa siap penempatan`,
      data: students,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil daftar mahasiswa"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Membuat satu jadwal penempatan stase (Single Placement)
 */
export async function createSinglePlacementAction(
  formData: FormData
): Promise<PlacementActionResult<{ placementId: string }>> {
  const rawData = {
    student_id: formData.get("student_id") as string,
    application_id: formData.get("application_id") as string,
    period_id: formData.get("period_id") as string,
    room_id: formData.get("room_id") as string,
    preceptor_id: (formData.get("preceptor_id") as string) || null,
    rotation_order: formData.get("rotation_order") || 1,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    status: (formData.get("status") as PlacementStatus) || "scheduled",
  }

  const validation = singlePlacementSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data penempatan tidak valid",
    }
  }

  try {
    const supabase = await createClient()

    // 1. Cek Kuota Ruangan pada Rentang Tanggal Tersebut
    const { data: room, error: roomError } = await supabase
      .from("rooms_units")
      .select("capacity, name")
      .eq("id", validation.data.room_id)
      .single()

    if (roomError) throw roomError

    const { count: overlappingRoomCount, error: countError } = await supabase
      .from("placements")
      .select("*", { count: "exact", head: true })
      .eq("room_id", validation.data.room_id)
      .in("status", ["scheduled", "active"])
      .lte("start_date", validation.data.end_date)
      .gte("end_date", validation.data.start_date)

    if (countError) throw countError

    const currentOccupied = overlappingRoomCount || 0
    if (currentOccupied >= room.capacity) {
      return {
        success: false,
        message: `Kapasitas kuota ruangan ${room.name} penuh pada rentang tanggal tersebut (${currentOccupied}/${room.capacity} terisi).`,
      }
    }

    // 2. Cek Overlap Jadwal Mahasiswa (mencegah double-booking pada mahasiswa yang sama)
    const { count: studentOverlapCount, error: studentCheckError } = await supabase
      .from("placements")
      .select("*", { count: "exact", head: true })
      .eq("student_id", validation.data.student_id)
      .in("status", ["scheduled", "active"])
      .lte("start_date", validation.data.end_date)
      .gte("end_date", validation.data.start_date)

    if (studentCheckError) throw studentCheckError

    if ((studentOverlapCount || 0) > 0) {
      return {
        success: false,
        message: "Mahasiswa ini telah memiliki jadwal stase lain yang aktif pada rentang tanggal tersebut.",
      }
    }

    // 3. Masukkan data penempatan
    const { data: createdPlacement, error: insertError } = await supabase
      .from("placements")
      .insert({
        student_id: validation.data.student_id,
        application_id: validation.data.application_id,
        period_id: validation.data.period_id,
        room_id: validation.data.room_id,
        preceptor_id: validation.data.preceptor_id || null,
        rotation_order: validation.data.rotation_order,
        start_date: validation.data.start_date,
        end_date: validation.data.end_date,
        status: validation.data.status,
      })
      .select("id")
      .single()

    if (insertError) throw insertError

    // 4. Update status pengajuan mahasiswa menjadi 'aktif' jika masih 'disetujui'
    await supabase
      .from("student_applications")
      .update({ status: "aktif" })
      .eq("id", validation.data.application_id)
      .eq("status", "disetujui")

    await recordAuditLog({
      action: "CREATE",
      entity: "placements",
      recordId: createdPlacement.id,
      newValues: {
        student_id: validation.data.student_id,
        room_id: validation.data.room_id,
        room_name: room.name,
        rotation_order: validation.data.rotation_order,
        start_date: validation.data.start_date,
        end_date: validation.data.end_date,
      },
    })

    revalidatePath("/dashboard/penempatan")
    revalidatePath("/dashboard/pengajuan")

    return {
      success: true,
      message: `Jadwal penempatan mahasiswa ke ${room.name} berhasil dibuat!`,
      data: { placementId: createdPlacement.id },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat penempatan"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Membuat Paket Rotasi Multi-Stase Beruntun (Multi-Stage Rotation)
 */
export async function createMultiRotationScheduleAction(
  payload: MultiRotationScheduleInput
): Promise<PlacementActionResult<{ totalStages: number }>> {
  const validation = multiRotationScheduleSchema.safeParse(payload)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Konfigurasi rotasi tidak valid",
    }
  }

  try {
    const supabase = await createClient()

    // Validasi internal overlap dalam daftar rotasi yang dikirim
    const sortedRotations = [...validation.data.rotations].sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    )

    for (let i = 0; i < sortedRotations.length - 1; i++) {
      const current = sortedRotations[i]
      const next = sortedRotations[i + 1]
      if (new Date(current.end_date) >= new Date(next.start_date)) {
        return {
          success: false,
          message: `Rentang tanggal Stase ${current.rotation_order} tumpang tindih dengan Stase ${next.rotation_order}.`,
        }
      }
    }

    // Insert seluruh stase
    const insertPayload = sortedRotations.map((r, idx) => ({
      student_id: validation.data.student_id,
      application_id: validation.data.application_id,
      period_id: validation.data.period_id,
      room_id: r.room_id,
      preceptor_id: r.preceptor_id || null,
      rotation_order: idx + 1,
      start_date: r.start_date,
      end_date: r.end_date,
      status: "scheduled" as PlacementStatus,
    }))

    const { error: batchError } = await supabase.from("placements").insert(insertPayload)
    if (batchError) throw batchError

    // Update status pengajuan mahasiswa
    await supabase
      .from("student_applications")
      .update({ status: "aktif" })
      .eq("id", validation.data.application_id)
      .eq("status", "disetujui")

    await recordAuditLog({
      action: "CREATE_BATCH",
      entity: "placements",
      recordId: null,
      newValues: {
        student_id: validation.data.student_id,
        application_id: validation.data.application_id,
        total_stages: insertPayload.length,
      },
    })

    revalidatePath("/dashboard/penempatan")
    revalidatePath("/dashboard/pengajuan")

    return {
      success: true,
      message: `Berhasil merancang alur rotasi ${insertPayload.length} stase untuk mahasiswa tersebut!`,
      data: { totalStages: insertPayload.length },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan jadwal rotasi"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Memperbarui Data Penempatan (Update Placement)
 */
export async function updatePlacementAction(
  id: string,
  formData: FormData
): Promise<PlacementActionResult> {
  try {
    const supabase = await createClient()

    const rawData = {
      room_id: formData.get("room_id") as string,
      preceptor_id: (formData.get("preceptor_id") as string) || null,
      rotation_order: Number(formData.get("rotation_order") || 1),
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      status: (formData.get("status") as PlacementStatus) || "scheduled",
    }

    const { error } = await supabase
      .from("placements")
      .update({
        room_id: rawData.room_id,
        preceptor_id: rawData.preceptor_id,
        rotation_order: rawData.rotation_order,
        start_date: rawData.start_date,
        end_date: rawData.end_date,
        status: rawData.status,
      })
      .eq("id", id)

    if (error) throw error

    await recordAuditLog({
      action: "UPDATE",
      entity: "placements",
      recordId: id,
      newValues: rawData,
    })

    revalidatePath("/dashboard/penempatan")
    return { success: true, message: "Jadwal penempatan berhasil diperbarui" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui jadwal"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Menghapus Jadwal Penempatan
 */
export async function deletePlacementAction(id: string): Promise<PlacementActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("placements").delete().eq("id", id)
    if (error) throw error

    await recordAuditLog({
      action: "DELETE",
      entity: "placements",
      recordId: id,
    })

    revalidatePath("/dashboard/penempatan")
    return { success: true, message: "Jadwal penempatan berhasil dihapus" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus penempatan"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Mengubah Status Penempatan (scheduled -> active -> completed / cancelled)
 */
export async function updatePlacementStatusAction(
  formData: FormData
): Promise<PlacementActionResult> {
  const rawData = {
    placement_id: formData.get("placement_id") as string,
    status: formData.get("status") as PlacementStatus,
  }

  const validation = placementStatusSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Status tidak valid",
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("placements")
      .update({ status: validation.data.status })
      .eq("id", validation.data.placement_id)

    if (error) throw error

    await recordAuditLog({
      action: "UPDATE_STATUS",
      entity: "placements",
      recordId: validation.data.placement_id,
      newValues: { status: validation.data.status },
    })

    revalidatePath("/dashboard/penempatan")
    return {
      success: true,
      message: `Status penempatan berhasil diubah menjadi: ${validation.data.status}`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui status"
    return { success: false, message, error: String(err) }
  }
}
