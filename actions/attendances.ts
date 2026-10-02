"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import {
  checkInSchema,
  checkOutSchema,
  approveAttendanceSchema,
  bulkApproveAttendanceSchema,
  manualAttendanceSchema,
} from "@/lib/validations/attendances"
import { AttendanceStatus, USER_ROLES } from "@/lib/constants"
import { recordAuditLog } from "@/lib/audit/logger"
import {
  calculateShiftLateStatus,
  autoDetectCurrentShift,
  WorkShift,
  DEFAULT_SHIFTS,
} from "@/lib/validations/shifts"

export interface AttendanceActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface AttendanceWithRelations {
  id: string
  student_id: string
  placement_id: string
  room_id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  status: AttendanceStatus
  notes: string | null
  is_approved: boolean
  approved_by_id: string | null
  created_at: string
  latitude?: number | null
  longitude?: number | null
  distance_meters?: number | null
  is_mock_detected?: boolean
  mock_detection_reason?: string | null
  verification_method?: string | null
  selfie_snapshot?: string | null
  device_info?: string | null
  shift_id?: string | null
  shift_name?: string | null
  is_late?: boolean
  late_minutes?: number
  students?: {
    id: string
    nim: string
    full_name: string
    gender: string
    institutions?: { name: string } | null
    study_programs?: { name: string; degree: string } | null
  } | null
  rooms_units?: {
    id: string
    name: string
    code: string
  } | null
  placements?: {
    id: string
    rotation_order: number
    start_date: string
    end_date: string
    preceptors?: { id: string; name: string } | null
  } | null
  approver?: {
    id: string
    full_name: string
  } | null
}

export interface AttendanceSummaryItem {
  student_id: string
  student_name: string
  student_nim: string
  institution_name: string
  study_program_name: string
  placement_id: string
  room_name: string
  rotation_order: number
  total_records: number
  hadir_count: number
  izin_count: number
  sakit_count: number
  alpa_count: number
  attendance_percentage: number
  is_eligible: boolean
}

/**
 * Format tanggal hari ini dalam format YYYY-MM-DD
 */
function getTodayString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Mengambil daftar presensi pada tanggal tertentu (default hari ini)
 */
export async function getTodayAttendancesAction(filters?: {
  date?: string
  roomId?: string
  status?: string
  approvedOnly?: boolean
}): Promise<AttendanceActionResult<AttendanceWithRelations[]>> {
  try {
    const supabase = await createClient()
    const targetDate = filters?.date || getTodayString()

    let query = supabase
      .from("attendances")
      .select(
        `
        *,
        students (
          id,
          nim,
          full_name,
          gender,
          institutions (name),
          study_programs (name, degree)
        ),
        rooms_units (id, name, code),
        placements (
          id,
          rotation_order,
          start_date,
          end_date,
          preceptors (id, name)
        ),
        approver:profiles!attendances_approved_by_id_fkey (id, full_name)
      `
      )
      .eq("date", targetDate)
      .order("created_at", { ascending: false })

    if (filters?.roomId && filters.roomId !== "all") {
      query = query.eq("room_id", filters.roomId)
    }
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }
    if (filters?.approvedOnly !== undefined) {
      query = query.eq("is_approved", filters.approvedOnly)
    }

    const { data, error } = await query
    if (error) throw error

    return {
      success: true,
      message: "Berhasil mengambil data presensi",
      data: (data as unknown as AttendanceWithRelations[]) || [],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data presensi"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Mengambil rekapitulasi kumulatif kehadiran (% attendance rate)
 */
export async function getAttendanceSummaryAction(
  periodId?: string,
  roomId?: string
): Promise<AttendanceActionResult<AttendanceSummaryItem[]>> {
  try {
    const supabase = await createClient()

    // 1. Ambil seluruh penempatan aktif/selesai
    let placementQuery = supabase
      .from("placements")
      .select(
        `
        id,
        rotation_order,
        student_id,
        room_id,
        period_id,
        students (
          id,
          nim,
          full_name,
          institutions (name),
          study_programs (name)
        ),
        rooms_units (id, name)
      `
      )
      .in("status", ["active", "completed", "scheduled"])

    if (periodId && periodId !== "all") {
      placementQuery = placementQuery.eq("period_id", periodId)
    }
    if (roomId && roomId !== "all") {
      placementQuery = placementQuery.eq("room_id", roomId)
    }

    const { data: placements, error: placementError } = await placementQuery
    if (placementError) throw placementError

    if (!placements || placements.length === 0) {
      return { success: true, message: "Tidak ada data penempatan", data: [] }
    }

    const placementIds = placements.map((p) => p.id)

    // 2. Ambil seluruh log presensi untuk penempatan tersebut
    const { data: attendances, error: attError } = await supabase
      .from("attendances")
      .select("id, placement_id, status, is_approved")
      .in("placement_id", placementIds)

    if (attError) throw attError

    // Grouping per placement
    const attendanceByPlacement = new Map<string, Array<{ status: string; is_approved: boolean }>>()
    for (const a of attendances || []) {
      if (!attendanceByPlacement.has(a.placement_id)) {
        attendanceByPlacement.set(a.placement_id, [])
      }
      attendanceByPlacement.get(a.placement_id)!.push(a)
    }

    // Kalkulasi ringkasan per mahasiswa & stase
    const summary: AttendanceSummaryItem[] = []

    for (const p of placements) {
      const attList = attendanceByPlacement.get(p.id) || []
      const student = p.students as unknown as {
        id: string
        nim: string
        full_name: string
        institutions?: { name: string } | null
        study_programs?: { name: string } | null
      } | null
      const room = p.rooms_units as unknown as { id: string; name: string } | null

      const total = attList.length
      const hadir = attList.filter((a) => a.status === "hadir").length
      const izin = attList.filter((a) => a.status === "izin").length
      const sakit = attList.filter((a) => a.status === "sakit").length
      const alpa = attList.filter((a) => a.status === "alpa").length

      // Persentase kehadiran: (Hadir + Izin) / Total (jika total > 0)
      const percentage = total > 0 ? Math.round((hadir / total) * 100) : 100
      const isEligible = percentage >= 80

      summary.push({
        student_id: p.student_id,
        student_name: student?.full_name || "Mahasiswa",
        student_nim: student?.nim || "-",
        institution_name: student?.institutions?.name || "-",
        study_program_name: student?.study_programs?.name || "-",
        placement_id: p.id,
        room_name: room?.name || "-",
        rotation_order: p.rotation_order,
        total_records: total,
        hadir_count: hadir,
        izin_count: izin,
        sakit_count: sakit,
        alpa_count: alpa,
        attendance_percentage: percentage,
        is_eligible: isEligible,
      })
    }

    return {
      success: true,
      message: "Berhasil merekap kehadiran",
      data: summary,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal merekap presensi"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Melakukan Check-In Presensi Digital Mahasiswa
 */
export async function checkInAction(
  formData: FormData
): Promise<AttendanceActionResult<{ attendanceId: string }>> {
  const rawData = {
    placement_id: formData.get("placement_id") as string,
    date: (formData.get("date") as string) || getTodayString(),
    status: (formData.get("status") as AttendanceStatus) || "hadir",
    notes: (formData.get("notes") as string) || "",
  }

  const validation = checkInSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data check-in tidak valid",
    }
  }

  // Telemetri Geolocation & Biometrik
  const latStr = formData.get("latitude") as string | null
  const lonStr = formData.get("longitude") as string | null
  const distStr = formData.get("distance_meters") as string | null

  const latitude = latStr ? parseFloat(latStr) : null
  const longitude = lonStr ? parseFloat(lonStr) : null
  const distanceMeters = distStr ? parseFloat(distStr) : null
  const isMockDetected = formData.get("is_mock_detected") === "true"
  const mockReason = (formData.get("mock_detection_reason") as string) || null
  const verificationMethod =
    (formData.get("verification_method") as string) || "terminal_manual"
  const selfieSnapshot = (formData.get("selfie_snapshot") as string) || null
  const deviceInfo = (formData.get("device_info") as string) || null

  // Validasi Keamanan: Tolak jika Fake GPS terdeteksi
  if (isMockDetected) {
    return {
      success: false,
      message: `Presensi Ditolak: Terdeteksi penggunaan aplikasi Fake GPS / Mock Location (${mockReason || "Anomali koordinat"}). Presensi harus dilakukan dengan GPS asli di lokasi RSUD.`,
    }
  }

  // Validasi Geofence: Tolak jika jarak di luar batas toleransi (> 250m) saat metode menggunakan GPS
  if (distanceMeters !== null && distanceMeters > 250) {
    return {
      success: false,
      message: `Presensi Ditolak: Anda berada di luar area RSUD Bulukumba (Jarak: ${Math.round(distanceMeters)} m, batas geofence: 250 m).`,
    }
  }

  try {
    const supabase = await createClient()

    // 1. Ambil detail penempatan untuk mendapatkan student_id & room_id
    const { data: placement, error: plError } = await supabase
      .from("placements")
      .select("id, student_id, room_id, rooms_units(name)")
      .eq("id", validation.data.placement_id)
      .single()

    if (plError || !placement) {
      return { success: false, message: "Jadwal penempatan aktif tidak ditemukan" }
    }

    const targetDate = validation.data.date || getTodayString()

    // 2. Resolve Shift & Jam Kerja
    const shiftId = (formData.get("shift_id") as string) || null
    let shiftName = (formData.get("shift_name") as string) || null

    let selectedShift: WorkShift | null = null
    if (shiftId) {
      const { data: shiftDb } = await supabase.from("work_shifts").select("*").eq("id", shiftId).maybeSingle()
      selectedShift = shiftDb || DEFAULT_SHIFTS.find((s) => s.id === shiftId) || null
    }

    // Cek apakah mahasiswa memiliki jadwal di Roster Jaga hari ini
    if (!selectedShift) {
      try {
        const { data: rosterSched } = await supabase
          .from("roster_schedules")
          .select("shift_id")
          .eq("student_id", placement.student_id)
          .eq("date", targetDate)
          .maybeSingle()

        if (rosterSched?.shift_id) {
          const { data: rosterShiftDb } = await supabase
            .from("work_shifts")
            .select("*")
            .eq("id", rosterSched.shift_id)
            .maybeSingle()
          selectedShift = rosterShiftDb || DEFAULT_SHIFTS.find((s) => s.id === rosterSched.shift_id) || null
        }
      } catch {
        // Fallback jika tabel roster belum terisi
      }
    }

    if (!selectedShift) {
      const { data: activeShifts } = await supabase.from("work_shifts").select("*").eq("is_active", true)
      const shiftsList = (activeShifts && activeShifts.length > 0) ? activeShifts : DEFAULT_SHIFTS
      selectedShift = autoDetectCurrentShift(shiftsList, new Date())
    }

    if (selectedShift && !shiftName) {
      shiftName = selectedShift.name
    }

    let isLate = false
    let lateMinutes = 0
    if (selectedShift && validation.data.status === "hadir") {
      const lateCheck = calculateShiftLateStatus(selectedShift, new Date())
      isLate = lateCheck.isLate
      lateMinutes = lateCheck.lateMinutes
    }

    // 3. Cek apakah sudah pernah presensi pada hari ini
    const { data: existing } = await supabase
      .from("attendances")
      .select("id, check_in_time")
      .eq("student_id", placement.student_id)
      .eq("placement_id", placement.id)
      .eq("date", targetDate)
      .maybeSingle()

    if (existing) {
      return {
        success: false,
        message: "Anda telah melakukan check-in untuk tanggal hari ini.",
      }
    }

    // 4. Masukkan presensi beserta telemetri geofence, biometrik & shift
    const nowIso = new Date().toISOString()
    const { data: created, error: insertError } = await supabase
      .from("attendances")
      .insert({
        student_id: placement.student_id,
        placement_id: placement.id,
        room_id: placement.room_id,
        date: targetDate,
        check_in_time: validation.data.status === "hadir" ? nowIso : null,
        status: validation.data.status,
        notes: validation.data.notes || null,
        is_approved: false,
        latitude,
        longitude,
        distance_meters: distanceMeters,
        is_mock_detected: isMockDetected,
        mock_detection_reason: mockReason,
        verification_method: verificationMethod,
        selfie_snapshot: selfieSnapshot,
        device_info: deviceInfo,
        shift_id: selectedShift?.id || null,
        shift_name: shiftName,
        is_late: isLate,
        late_minutes: lateMinutes,
      })
      .select("id")
      .single()

    if (insertError) throw insertError

    await recordAuditLog({
      action: "CHECK_IN",
      entity: "attendances",
      recordId: created.id,
      newValues: {
        student_id: placement.student_id,
        placement_id: placement.id,
        room_id: placement.room_id,
        date: targetDate,
        status: validation.data.status,
        verification_method: verificationMethod,
        distance_meters: distanceMeters,
      },
    })

    revalidatePath("/dashboard/presensi")
    return {
      success: true,
      message: `Check-in berhasil tercatat (${validation.data.status}) melalui verifikasi ${verificationMethod.replace("_", " ")}!`,
      data: { attendanceId: created.id },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal melakukan check-in"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Melakukan Check-Out Presensi Digital Mahasiswa
 */
export async function checkOutAction(
  formData: FormData
): Promise<AttendanceActionResult> {
  const attendanceId = formData.get("attendance_id") as string

  const validation = checkOutSchema.safeParse({ attendance_id: attendanceId })
  if (!validation.success) {
    return { success: false, message: "ID presensi tidak valid" }
  }

  const isMockDetected = formData.get("is_mock_detected") === "true"
  const distStr = formData.get("distance_meters") as string | null
  const distanceMeters = distStr ? parseFloat(distStr) : null

  if (isMockDetected) {
    return {
      success: false,
      message: "Check-out Ditolak: Terdeteksi aplikasi Fake GPS / Mock Location.",
    }
  }

  if (distanceMeters !== null && distanceMeters > 250) {
    return {
      success: false,
      message: `Check-out Ditolak: Anda berada di luar area RSUD Bulukumba (${Math.round(distanceMeters)} m).`,
    }
  }

  try {
    const supabase = await createClient()

    const nowIso = new Date().toISOString()
    const { error } = await supabase
      .from("attendances")
      .update({
        check_out_time: nowIso,
        updated_at: nowIso,
      })
      .eq("id", validation.data.attendance_id)

    if (error) throw error

    await recordAuditLog({
      action: "CHECK_OUT",
      entity: "attendances",
      recordId: validation.data.attendance_id,
      newValues: { check_out_time: nowIso },
    })

    revalidatePath("/dashboard/presensi")
    return { success: true, message: "Check-out kepulangan dinas berhasil dicatat!" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal melakukan check-out"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Approval / Persetujuan Presensi oleh Pembimbing / Kepala Ruangan
 */
export async function approveAttendanceAction(
  attendanceId: string,
  isApproved: boolean = true
): Promise<AttendanceActionResult> {
  const validation = approveAttendanceSchema.safeParse({
    attendance_id: attendanceId,
    is_approved: isApproved,
  })

  if (!validation.success) {
    return { success: false, message: "Data persetujuan tidak valid" }
  }

  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === USER_ROLES.MAHASISWA) {
      return {
        success: false,
        message: "Akses ditolak: Mahasiswa tidak memiliki izin untuk menyetujui presensi.",
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("attendances")
      .update({
        is_approved: validation.data.is_approved,
        approved_by_id: user?.id || null,
      })
      .eq("id", validation.data.attendance_id)

    if (error) throw error

    await recordAuditLog({
      userId: user?.id || null,
      action: validation.data.is_approved ? "APPROVE" : "REJECT",
      entity: "attendances",
      recordId: validation.data.attendance_id,
      newValues: { is_approved: validation.data.is_approved, approved_by_id: user?.id || null },
    })

    revalidatePath("/dashboard/presensi")
    return {
      success: true,
      message: validation.data.is_approved
        ? "Presensi mahasiswa berhasil disetujui"
        : "Persetujuan presensi dibatalkan",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyetujui presensi"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Bulk Approval (Setujui Seluruh Presensi Terpilih Hari Ini)
 */
export async function bulkApproveAttendancesAction(
  attendanceIds: string[]
): Promise<AttendanceActionResult<{ totalApproved: number }>> {
  const validation = bulkApproveAttendanceSchema.safeParse({
    attendance_ids: attendanceIds,
  })

  if (!validation.success) {
    return { success: false, message: "Daftar presensi tidak boleh kosong" }
  }

  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === USER_ROLES.MAHASISWA) {
      return {
        success: false,
        message: "Akses ditolak: Mahasiswa tidak memiliki izin untuk menyetujui presensi massal.",
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase
      .from("attendances")
      .update({
        is_approved: true,
        approved_by_id: user?.id || null,
      })
      .in("id", validation.data.attendance_ids)

    if (error) throw error

    await recordAuditLog({
      userId: user?.id || null,
      action: "BULK_APPROVE",
      entity: "attendances",
      recordId: null,
      newValues: {
        approved_count: validation.data.attendance_ids.length,
        attendance_ids: validation.data.attendance_ids,
      },
    })

    revalidatePath("/dashboard/presensi")
    return {
      success: true,
      message: `Berhasil menyetujui ${validation.data.attendance_ids.length} presensi mahasiswa!`,
      data: { totalApproved: validation.data.attendance_ids.length },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal melakukan persetujuan massal"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Pencatatan Presensi Manual oleh Staf Diklat / Kepala Ruangan
 */
export async function manualRecordAttendanceAction(
  formData: FormData
): Promise<AttendanceActionResult<{ attendanceId: string }>> {
  const rawData = {
    student_id: formData.get("student_id") as string,
    placement_id: formData.get("placement_id") as string,
    room_id: formData.get("room_id") as string,
    date: formData.get("date") as string,
    status: formData.get("status") as AttendanceStatus,
    check_in_time: (formData.get("check_in_time") as string) || null,
    check_out_time: (formData.get("check_out_time") as string) || null,
    notes: (formData.get("notes") as string) || "",
    is_approved: true,
  }

  const validation = manualAttendanceSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data input manual tidak valid",
    }
  }

  try {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === USER_ROLES.MAHASISWA) {
      return {
        success: false,
        message:
          "Akses ditolak: Mahasiswa tidak diizinkan menginput presensi secara manual. Silakan gunakan Presensi Mobile berbasis GPS.",
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const checkInIso = validation.data.check_in_time
      ? new Date(`${validation.data.date}T${validation.data.check_in_time}:00`).toISOString()
      : null
    const checkOutIso = validation.data.check_out_time
      ? new Date(`${validation.data.date}T${validation.data.check_out_time}:00`).toISOString()
      : null

    const shiftId = (formData.get("shift_id") as string) || null
    const shiftName = (formData.get("shift_name") as string) || null
    let isLate = false
    let lateMinutes = 0

    if (shiftId && checkInIso) {
      const checkInDate = new Date(checkInIso)
      const shift = DEFAULT_SHIFTS.find((s) => s.id === shiftId)
      if (shift) {
        const lateCheck = calculateShiftLateStatus(shift, checkInDate)
        isLate = lateCheck.isLate
        lateMinutes = lateCheck.lateMinutes
      }
    }

    const { data: created, error } = await supabase
      .from("attendances")
      .upsert(
        {
          student_id: validation.data.student_id,
          placement_id: validation.data.placement_id,
          room_id: validation.data.room_id,
          date: validation.data.date,
          status: validation.data.status,
          check_in_time: checkInIso,
          check_out_time: checkOutIso,
          notes: validation.data.notes || null,
          is_approved: true,
          approved_by_id: user?.id || null,
          shift_id: shiftId,
          shift_name: shiftName,
          is_late: isLate,
          late_minutes: lateMinutes,
        },
        { onConflict: "student_id,placement_id,date" }
      )
      .select("id")
      .single()

    if (error) throw error

    await recordAuditLog({
      userId: user?.id || null,
      action: "CREATE",
      entity: "attendances",
      recordId: created.id,
      newValues: {
        student_id: validation.data.student_id,
        placement_id: validation.data.placement_id,
        status: validation.data.status,
        type: "manual",
      },
    })

    revalidatePath("/dashboard/presensi")
    return {
      success: true,
      message: "Presensi manual berhasil disimpan!",
      data: { attendanceId: created.id },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mencatat presensi manual"
    return { success: false, message, error: String(err) }
  }
}
