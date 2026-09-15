"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { recordAuditLog } from "@/lib/audit/logger"
import {
  positionSchema,
  JobPosition,
  DEFAULT_POSITIONS,
  PositionActionResult,
} from "@/lib/validations/positions"

/**
 * Mengambil daftar seluruh master jabatan rumah sakit
 */
export async function getPositionsAction(
  activeOnly = false
): Promise<PositionActionResult<JobPosition[]>> {
  try {
    const supabase = await createClient()

    let query = supabase.from("job_positions").select("*").order("name", { ascending: true })

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data, error } = await query

    if (error) {
      console.warn("Supabase query job_positions failed, using fallback:", error.message)
      return {
        success: true,
        message: "Data jabatan rumah sakit (fallback mode)",
        data: activeOnly ? DEFAULT_POSITIONS.filter((p) => p.is_active) : DEFAULT_POSITIONS,
      }
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        message: "Data jabatan default",
        data: activeOnly ? DEFAULT_POSITIONS.filter((p) => p.is_active) : DEFAULT_POSITIONS,
      }
    }

    return {
      success: true,
      message: "Berhasil memuat data jabatan",
      data: data as JobPosition[],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat data jabatan"
    return {
      success: true,
      message,
      data: activeOnly ? DEFAULT_POSITIONS.filter((p) => p.is_active) : DEFAULT_POSITIONS,
    }
  }
}

/**
 * Menambahkan jabatan baru
 */
export async function createPositionAction(
  formData: FormData
): Promise<PositionActionResult<JobPosition>> {
  try {
    const supabase = await createClient()

    const rawData = {
      name: formData.get("name") as string,
      code: ((formData.get("code") as string) || "").toUpperCase(),
      category: formData.get("category") as string,
      level: formData.get("level") as string,
      description: (formData.get("description") as string) || null,
      is_active: formData.get("is_active") === "true",
    }

    const validation = positionSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0]?.message || "Data jabatan tidak valid",
      }
    }

    const { data, error } = await supabase
      .from("job_positions")
      .insert([validation.data])
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          message: `Kode jabatan '${validation.data.code}' sudah digunakan. Silakan gunakan kode lain.`,
        }
      }
      return { success: false, message: `Gagal menyimpan data jabatan: ${error.message}` }
    }

    await recordAuditLog({
      action: "CREATE",
      entity: "job_positions",
      recordId: data.id,
      newValues: validation.data,
    })

    revalidatePath("/dashboard/master/jabatan")
    revalidatePath("/dashboard/master")

    return {
      success: true,
      message: `Jabatan '${data.name}' berhasil ditambahkan`,
      data: data as JobPosition,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat jabatan baru"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Memperbarui data jabatan
 */
export async function updatePositionAction(
  id: string,
  formData: FormData
): Promise<PositionActionResult<JobPosition>> {
  try {
    const supabase = await createClient()

    const rawData = {
      name: formData.get("name") as string,
      code: ((formData.get("code") as string) || "").toUpperCase(),
      category: formData.get("category") as string,
      level: formData.get("level") as string,
      description: (formData.get("description") as string) || null,
      is_active: formData.get("is_active") === "true",
    }

    const validation = positionSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0]?.message || "Data jabatan tidak valid",
      }
    }

    const { data, error } = await supabase
      .from("job_positions")
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          message: `Kode jabatan '${validation.data.code}' sudah digunakan oleh jabatan lain.`,
        }
      }
      return { success: false, message: `Gagal memperbarui data jabatan: ${error.message}` }
    }

    await recordAuditLog({
      action: "UPDATE",
      entity: "job_positions",
      recordId: id,
      newValues: validation.data,
    })

    revalidatePath("/dashboard/master/jabatan")
    revalidatePath("/dashboard/master")

    return {
      success: true,
      message: `Jabatan '${data.name}' berhasil diperbarui`,
      data: data as JobPosition,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui data jabatan"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Menghapus data jabatan
 */
export async function deletePositionAction(id: string): Promise<PositionActionResult> {
  try {
    const supabase = await createClient()

    const { data: existing, error: fetchErr } = await supabase
      .from("job_positions")
      .select("name, code")
      .eq("id", id)
      .single()

    if (fetchErr || !existing) {
      return { success: false, message: "Jabatan tidak ditemukan" }
    }

    const { error: delErr } = await supabase.from("job_positions").delete().eq("id", id)

    if (delErr) {
      return {
        success: false,
        message: `Gagal menghapus jabatan: ${delErr.message}.`,
      }
    }

    await recordAuditLog({
      action: "DELETE",
      entity: "job_positions",
      recordId: id,
      oldValues: existing,
    })

    revalidatePath("/dashboard/master/jabatan")
    revalidatePath("/dashboard/master")

    return {
      success: true,
      message: `Jabatan '${existing.name}' berhasil dihapus`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus data jabatan"
    return { success: false, message, error: String(err) }
  }
}
