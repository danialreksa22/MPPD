"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/auth"
import { USER_ROLES } from "@/lib/constants"
import { recordAuditLog } from "@/lib/audit/logger"
import {
  rosterScheduleSchema,
  batchRosterGeneratorSchema,
  rosterSwapRequestSchema,
  rosterSwapResponseSchema,
  RosterScheduleInput,
  BatchRosterGeneratorInput,
  RosterSwapRequestInput,
  RosterSwapResponseInput,
} from "@/lib/validations/roster"
import { WorkShift, DEFAULT_SHIFTS } from "@/lib/validations/shifts"

async function getDbClient() {
  try {
    return createAdminClient()
  } catch {
    return await createClient()
  }
}

export interface RosterScheduleWithRelations {
  id: string
  placement_id: string
  student_id: string
  room_id: string
  shift_id: string | null
  date: string
  notes: string | null
  created_at: string
  students?: {
    id: string
    nim: string
    full_name: string
    gender?: string
    institutions?: { name: string } | null
    study_programs?: { name: string } | null
  } | null
  rooms_units?: {
    id: string
    name: string
    code: string
  } | null
  work_shifts?: WorkShift | null
  placements?: {
    id: string
    rotation_order: number
  } | null
}

export interface RosterSwapWithRelations {
  id: string
  requester_schedule_id: string
  requester_student_id: string
  target_schedule_id: string
  target_student_id: string
  reason: string
  status: "pending" | "approved" | "rejected"
  rejection_reason?: string | null
  created_at: string
  requester_student?: {
    nim: string
    full_name: string
  } | null
  target_student?: {
    nim: string
    full_name: string
  } | null
  requester_schedule?: {
    date: string
    work_shifts?: { name: string; color: string } | null
  } | null
  target_schedule?: {
    date: string
    work_shifts?: { name: string; color: string } | null
  } | null
}

export interface RosterActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

/**
 * Mengambil daftar jadwal roster dinas berdasarkan filter ruangan/bulan/mahasiswa
 */
export async function getRosterSchedulesAction(filters?: {
  roomId?: string
  studentId?: string
  startDate?: string
  endDate?: string
  month?: number
  year?: number
}): Promise<RosterActionResult<RosterScheduleWithRelations[]>> {
  try {
    const supabase = await getDbClient()

    let query = supabase
      .from("roster_schedules")
      .select(
        `
        id,
        placement_id,
        student_id,
        room_id,
        shift_id,
        date,
        notes,
        created_at,
        students (
          id,
          nim,
          full_name,
          gender,
          institutions (name),
          study_programs (name)
        ),
        rooms_units (id, name, code),
        work_shifts (*),
        placements (id, rotation_order)
      `
      )
      .order("date", { ascending: true })

    if (filters?.roomId && filters.roomId !== "all") {
      query = query.eq("room_id", filters.roomId)
    }

    if (filters?.studentId) {
      query = query.eq("student_id", filters.studentId)
    }

    if (filters?.startDate && filters?.endDate) {
      query = query.gte("date", filters.startDate).lte("date", filters.endDate)
    } else if (filters?.year && filters?.month) {
      const start = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`
      const lastDay = new Date(filters.year, filters.month, 0).getDate()
      const end = `${filters.year}-${String(filters.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
      query = query.gte("date", start).lte("date", end)
    }

    const { data, error } = await query

    if (error) {
      console.warn("Gagal mengambil data roster dari Supabase, fallback kosong", error)
      return { success: true, message: "Belum ada jadwal roster tersimpan", data: [] }
    }

    return {
      success: true,
      message: "Berhasil memuat jadwal roster",
      data: (data as unknown as RosterScheduleWithRelations[]) || [],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat jadwal roster"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Menyimpan / memperbarui jadwal dinas individual
 */
export async function upsertRosterScheduleAction(
  rawInput: RosterScheduleInput
): Promise<RosterActionResult<{ id: string }>> {
  const validation = rosterScheduleSchema.safeParse(rawInput)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Input jadwal tidak valid",
    }
  }

  const currentUser = await getCurrentUser()
  if (currentUser?.role === USER_ROLES.MAHASISWA) {
    return {
      success: false,
      message: "Akses ditolak: Mahasiswa tidak memiliki izin untuk mengedit jadwal roster.",
    }
  }

  try {
    const supabase = await getDbClient()
    const { id, placement_id, student_id, room_id, shift_id, date, notes } = validation.data

    const payload = {
      ...(id ? { id } : {}),
      placement_id,
      student_id,
      room_id,
      shift_id: shift_id || null,
      date,
      notes: notes || null,
      created_by: currentUser?.id || null,
      updated_at: new Date().toISOString(),
    }

    const { data: saved, error } = await supabase
      .from("roster_schedules")
      .upsert(payload, { onConflict: "student_id,date" })
      .select("id")
      .single()

    if (error) throw error

    await recordAuditLog({
      action: id ? "UPDATE" : "CREATE",
      entity: "roster_schedules",
      recordId: saved.id,
      newValues: payload,
    })

    revalidatePath("/dashboard/roster")
    revalidatePath("/dashboard/presensi")
    return {
      success: true,
      message: "Jadwal dinas mahasiswa berhasil diperbarui!",
      data: { id: saved.id },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan jadwal dinas"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Generator Roster Otomatis untuk sekelompok mahasiswa pada rentang tanggal
 */
export async function generateBatchRosterAction(
  rawInput: BatchRosterGeneratorInput
): Promise<RosterActionResult<{ totalCreated: number }>> {
  const validation = batchRosterGeneratorSchema.safeParse(rawInput)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Input generator roster tidak valid",
    }
  }

  const currentUser = await getCurrentUser()
  if (currentUser?.role === USER_ROLES.MAHASISWA) {
    return {
      success: false,
      message: "Akses ditolak: Mahasiswa tidak diizinkan membuat roster otomatis.",
    }
  }

  try {
    const supabase = await getDbClient()
    const { room_id, student_ids, start_date, end_date, pattern, notes } = validation.data

    // 1. Ambil penempatan aktif mahasiswa tersebut di ruangan terpilih
    const { data: placements, error: plErr } = await supabase
      .from("placements")
      .select("id, student_id, room_id")
      .eq("room_id", room_id)
      .in("student_id", student_ids)
      .in("status", ["active", "scheduled", "completed"])

    if (plErr || !placements || placements.length === 0) {
      return {
        success: false,
        message: "Tidak ditemukan penempatan aktif mahasiswa pada ruangan yang dipilih.",
      }
    }

    const studentToPlacementMap = new Map<string, string>()
    for (const p of placements) {
      studentToPlacementMap.set(p.student_id, p.id)
    }

    // 2. Ambil master shift aktif
    const { data: shiftsDb } = await supabase
      .from("work_shifts")
      .select("id, code, name")
      .eq("is_active", true)

    const shifts = (shiftsDb && shiftsDb.length > 0) ? shiftsDb : DEFAULT_SHIFTS
    const pagiShift = shifts.find((s) => s.code.toUpperCase().includes("PAGI"))?.id || shifts[0]?.id
    const siangShift = shifts.find((s) => s.code.toUpperCase().includes("SIANG") || s.code.toUpperCase().includes("SORE"))?.id || shifts[1]?.id || pagiShift
    const malamShift = shifts.find((s) => s.code.toUpperCase().includes("MALAM"))?.id || shifts[2]?.id || siangShift

    // 3. Susun pola shift per hari
    // Pola 4 Hari: Pagi, Siang, Malam, Libur (null)
    const patternCycles: Record<string, Array<string | null>> = {
      pagi_siang_malam_libur: [pagiShift, siangShift, malamShift, null],
      pagi_siang_libur: [pagiShift, siangShift, null],
      pagi_only: [pagiShift],
      rotasi_kelompok: [pagiShift, siangShift, malamShift],
    }

    const selectedCycle = patternCycles[pattern] || [pagiShift]

    // 4. Hitung daftar tanggal
    const startDateObj = new Date(start_date)
    const endDateObj = new Date(end_date)
    const recordsToUpsert: Array<{
      placement_id: string
      student_id: string
      room_id: string
      shift_id: string | null
      date: string
      notes: string | null
      created_by: string | null
    }> = []

    let studentIndex = 0
    for (const studentId of student_ids) {
      const placementId = studentToPlacementMap.get(studentId)
      if (!placementId) continue

      // Beri offset awal agar tidak semua mahasiswa mendapat shift yang sama bersamaan
      let cycleOffset = studentIndex % selectedCycle.length

      const currentDate = new Date(startDateObj)
      while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().split("T")[0]
        const assignedShift = selectedCycle[cycleOffset % selectedCycle.length]

        recordsToUpsert.push({
          placement_id: placementId,
          student_id: studentId,
          room_id: room_id,
          shift_id: assignedShift,
          date: dateStr,
          notes: notes || null,
          created_by: currentUser?.id || null,
        })

        cycleOffset++
        currentDate.setDate(currentDate.getDate() + 1)
      }

      studentIndex++
    }

    if (recordsToUpsert.length === 0) {
      return { success: false, message: "Tidak ada jadwal yang berhasil di-generate." }
    }

    // 5. Simpan batch ke tabel roster_schedules
    const { error: upsertErr } = await supabase
      .from("roster_schedules")
      .upsert(recordsToUpsert, { onConflict: "student_id,date" })

    if (upsertErr) throw upsertErr

    await recordAuditLog({
      action: "BATCH_GENERATE",
      entity: "roster_schedules",
      recordId: null,
      newValues: {
        room_id,
        pattern,
        start_date,
        end_date,
        total_schedules: recordsToUpsert.length,
      },
    })

    revalidatePath("/dashboard/roster")
    revalidatePath("/dashboard/presensi")

    return {
      success: true,
      message: `Berhasil men-generate ${recordsToUpsert.length} jadwal dinas untuk ${student_ids.length} mahasiswa!`,
      data: { totalCreated: recordsToUpsert.length },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal men-generate roster"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Menghapus jadwal dinas individual
 */
export async function deleteRosterScheduleAction(
  scheduleId: string
): Promise<RosterActionResult> {
  const currentUser = await getCurrentUser()
  if (currentUser?.role === USER_ROLES.MAHASISWA) {
    return {
      success: false,
      message: "Akses ditolak: Mahasiswa tidak memiliki izin untuk menghapus jadwal dinas.",
    }
  }

  try {
    const supabase = await getDbClient()
    const { error } = await supabase.from("roster_schedules").delete().eq("id", scheduleId)
    if (error) throw error

    revalidatePath("/dashboard/roster")
    return { success: true, message: "Jadwal dinas berhasil dihapus" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus jadwal dinas"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Mengambil daftar pengajuan tukar dinas
 */
export async function getRosterSwapsAction(filters?: {
  roomId?: string
  status?: string
  studentId?: string
}): Promise<RosterActionResult<RosterSwapWithRelations[]>> {
  try {
    const supabase = await getDbClient()

    let query = supabase
      .from("roster_swaps")
      .select(
        `
        id,
        requester_schedule_id,
        requester_student_id,
        target_schedule_id,
        target_student_id,
        reason,
        status,
        rejection_reason,
        created_at,
        requester_student:students!roster_swaps_requester_student_id_fkey (nim, full_name),
        target_student:students!roster_swaps_target_student_id_fkey (nim, full_name),
        requester_schedule:roster_schedules!roster_swaps_requester_schedule_id_fkey (
          date,
          work_shifts (name, color)
        ),
        target_schedule:roster_schedules!roster_swaps_target_schedule_id_fkey (
          date,
          work_shifts (name, color)
        )
      `
      )
      .order("created_at", { ascending: false })

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.studentId) {
      query = query.or(`requester_student_id.eq.${filters.studentId},target_student_id.eq.${filters.studentId}`)
    }

    const { data, error } = await query

    if (error) {
      return { success: true, message: "Belum ada pengajuan tukar dinas", data: [] }
    }

    return {
      success: true,
      message: "Berhasil memuat permohonan tukar dinas",
      data: (data as unknown as RosterSwapWithRelations[]) || [],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat tukar dinas"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Mengajukan Permohonan Tukar Dinas oleh Mahasiswa
 */
export async function requestRosterSwapAction(
  rawInput: RosterSwapRequestInput
): Promise<RosterActionResult<{ swapId: string }>> {
  const validation = rosterSwapRequestSchema.safeParse(rawInput)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Input pengajuan tukar tidak valid",
    }
  }

  try {
    const supabase = await getDbClient()
    const { requester_schedule_id, requester_student_id, target_schedule_id, target_student_id, reason } =
      validation.data

    if (requester_student_id === target_student_id) {
      return { success: false, message: "Anda tidak dapat mengajukan tukar dinas dengan diri sendiri." }
    }

    const { data: created, error } = await supabase
      .from("roster_swaps")
      .insert({
        requester_schedule_id,
        requester_student_id,
        target_schedule_id,
        target_student_id,
        reason,
        status: "pending",
      })
      .select("id")
      .single()

    if (error) throw error

    await recordAuditLog({
      action: "REQUEST_SWAP",
      entity: "roster_swaps",
      recordId: created.id,
      newValues: { requester_student_id, target_student_id, reason },
    })

    revalidatePath("/dashboard/roster")
    return {
      success: true,
      message: "Permohonan tukar dinas berhasil dikirim! Menunggu verifikasi Kepala Ruangan / CI.",
      data: { swapId: created.id },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengajukan tukar dinas"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Menyetujui atau Menolak Permohonan Tukar Dinas
 */
export async function respondRosterSwapAction(
  rawInput: RosterSwapResponseInput
): Promise<RosterActionResult> {
  const validation = rosterSwapResponseSchema.safeParse(rawInput)
  if (!validation.success) {
    return { success: false, message: "Respon tukar dinas tidak valid" }
  }

  const currentUser = await getCurrentUser()
  if (currentUser?.role === USER_ROLES.MAHASISWA) {
    return {
      success: false,
      message: "Akses ditolak: Hanya Kepala Ruangan atau Pembimbing yang dapat menyetujui tukar dinas.",
    }
  }

  try {
    const supabase = await getDbClient()
    const { swap_id, status, rejection_reason } = validation.data

    // 1. Ambil detail swap
    const { data: swap, error: fetchErr } = await supabase
      .from("roster_swaps")
      .select("*")
      .eq("id", swap_id)
      .single()

    if (fetchErr || !swap) {
      return { success: false, message: "Data permohonan tukar dinas tidak ditemukan" }
    }

    if (swap.status !== "pending") {
      return { success: false, message: `Permohonan sudah berstatus ${swap.status}.` }
    }

    // 2. Jika disetujui, tukar shift_id antara kedua jadwal dinas
    if (status === "approved") {
      const { data: schedA } = await supabase
        .from("roster_schedules")
        .select("id, shift_id, notes")
        .eq("id", swap.requester_schedule_id)
        .single()

      const { data: schedB } = await supabase
        .from("roster_schedules")
        .select("id, shift_id, notes")
        .eq("id", swap.target_schedule_id)
        .single()

      if (!schedA || !schedB) {
        return { success: false, message: "Salah satu jadwal yang akan ditukar sudah tidak tersedia." }
      }

      // Tukar shift
      await Promise.all([
        supabase
          .from("roster_schedules")
          .update({
            shift_id: schedB.shift_id,
            notes: `Tukar dinas disetujui (${schedA.notes || "Reguler"})`,
          })
          .eq("id", schedA.id),
        supabase
          .from("roster_schedules")
          .update({
            shift_id: schedA.shift_id,
            notes: `Tukar dinas disetujui (${schedB.notes || "Reguler"})`,
          })
          .eq("id", schedB.id),
      ])
    }

    // 3. Update status permohonan
    const { error: updateErr } = await supabase
      .from("roster_swaps")
      .update({
        status,
        rejection_reason: rejection_reason || null,
        approved_by: currentUser?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", swap_id)

    if (updateErr) throw updateErr

    await recordAuditLog({
      action: status === "approved" ? "APPROVE_SWAP" : "REJECT_SWAP",
      entity: "roster_swaps",
      recordId: swap_id,
      newValues: { status, rejection_reason },
    })

    revalidatePath("/dashboard/roster")
    revalidatePath("/dashboard/presensi")

    return {
      success: true,
      message:
        status === "approved"
          ? "Tukar dinas berhasil disetujui! Jadwal kedua mahasiswa telah diperbarui secara otomatis."
          : "Permohonan tukar dinas telah ditolak.",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memproses persetujuan tukar dinas"
    return { success: false, message, error: String(err) }
  }
}
