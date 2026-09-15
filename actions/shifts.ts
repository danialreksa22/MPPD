"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { recordAuditLog } from "@/lib/audit/logger"
import {
  shiftFormSchema,
  WorkShift,
  DEFAULT_SHIFTS,
  ShiftActionResult,
} from "@/lib/validations/shifts"

/**
 * Mengambil daftar seluruh shift kerja
 */
export async function getWorkShiftsAction(
  isActiveOnly: boolean = false
): Promise<ShiftActionResult<WorkShift[]>> {
  try {
    const supabase = await createClient()

    let query = supabase.from("work_shifts").select("*").order("start_time", { ascending: true })

    if (isActiveOnly) {
      query = query.eq("is_active", true)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      const fallback = isActiveOnly
        ? DEFAULT_SHIFTS.filter((s) => s.is_active)
        : DEFAULT_SHIFTS
      return {
        success: true,
        message: "Memuat data shift default RSUD Bulukumba",
        data: fallback,
      }
    }

    // Format waktu TIME Postgres "HH:mm:ss" menjadi "HH:mm" untuk UI
    const formattedData: WorkShift[] = data.map((s) => ({
      ...s,
      start_time: s.start_time.slice(0, 5),
      end_time: s.end_time.slice(0, 5),
      check_in_start: s.check_in_start.slice(0, 5),
      check_in_end: s.check_in_end.slice(0, 5),
      check_out_start: s.check_out_start.slice(0, 5),
      check_out_end: s.check_out_end.slice(0, 5),
    }))

    return {
      success: true,
      message: "Daftar shift berhasil dimuat",
      data: formattedData,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat shift"
    return {
      success: true,
      message,
      data: isActiveOnly ? DEFAULT_SHIFTS.filter((s) => s.is_active) : DEFAULT_SHIFTS,
    }
  }
}

/**
 * Menambahkan shift kerja baru
 */
export async function createWorkShiftAction(
  formData: FormData
): Promise<ShiftActionResult<{ id: string }>> {
  const rawData = {
    name: formData.get("name") as string,
    code: (formData.get("code") as string)?.toUpperCase(),
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    check_in_start: formData.get("check_in_start") as string,
    check_in_end: formData.get("check_in_end") as string,
    check_out_start: formData.get("check_out_start") as string,
    check_out_end: formData.get("check_out_end") as string,
    late_tolerance_minutes: formData.get("late_tolerance_minutes"),
    is_cross_day: formData.get("is_cross_day") === "true",
    color: formData.get("color") as "sky" | "amber" | "indigo" | "emerald" | "rose" | "purple",
    description: (formData.get("description") as string) || null,
    is_active: formData.get("is_active") === "true",
  }

  const validation = shiftFormSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data formulir shift tidak valid",
    }
  }

  try {
    const supabase = await createClient()

    const { data: created, error } = await supabase
      .from("work_shifts")
      .insert(validation.data)
      .select("id")
      .single()

    if (error) throw error

    await recordAuditLog({
      action: "CREATE",
      entity: "work_shifts",
      recordId: created.id,
      newValues: validation.data,
    })

    revalidatePath("/dashboard/master/shift")
    revalidatePath("/dashboard/master")
    revalidatePath("/dashboard/presensi")

    return {
      success: true,
      message: `Shift ${validation.data.name} berhasil ditambahkan!`,
      data: { id: created.id },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambahkan shift"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Memperbarui data shift kerja
 */
export async function updateWorkShiftAction(
  id: string,
  formData: FormData
): Promise<ShiftActionResult> {
  const rawData = {
    id,
    name: formData.get("name") as string,
    code: (formData.get("code") as string)?.toUpperCase(),
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    check_in_start: formData.get("check_in_start") as string,
    check_in_end: formData.get("check_in_end") as string,
    check_out_start: formData.get("check_out_start") as string,
    check_out_end: formData.get("check_out_end") as string,
    late_tolerance_minutes: formData.get("late_tolerance_minutes"),
    is_cross_day: formData.get("is_cross_day") === "true",
    color: formData.get("color") as "sky" | "amber" | "indigo" | "emerald" | "rose" | "purple",
    description: (formData.get("description") as string) || null,
    is_active: formData.get("is_active") === "true",
  }

  const validation = shiftFormSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data formulir shift tidak valid",
    }
  }

  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("work_shifts")
      .update(validation.data)
      .eq("id", id)

    if (error) throw error

    await recordAuditLog({
      action: "UPDATE",
      entity: "work_shifts",
      recordId: id,
      newValues: validation.data,
    })

    revalidatePath("/dashboard/master/shift")
    revalidatePath("/dashboard/master")
    revalidatePath("/dashboard/presensi")

    return {
      success: true,
      message: `Shift ${validation.data.name} berhasil diperbarui!`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui shift"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Menghapus shift kerja
 */
export async function deleteWorkShiftAction(id: string): Promise<ShiftActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("work_shifts").delete().eq("id", id)
    if (error) throw error

    await recordAuditLog({
      action: "DELETE",
      entity: "work_shifts",
      recordId: id,
    })

    revalidatePath("/dashboard/master/shift")
    revalidatePath("/dashboard/master")
    revalidatePath("/dashboard/presensi")

    return { success: true, message: "Shift berhasil dihapus dari master data" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus shift"
    return { success: false, message, error: String(err) }
  }
}
