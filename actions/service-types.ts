"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { recordAuditLog } from "@/lib/audit/logger"
import {
  serviceTypeSchema,
  ServiceType,
  DEFAULT_SERVICE_TYPES,
  ServiceTypeActionResult,
} from "@/lib/validations/service-types"

/**
 * Mengambil daftar seluruh jenis pelayanan rumah sakit
 */
export async function getServiceTypesAction(
  activeOnly = false
): Promise<ServiceTypeActionResult<ServiceType[]>> {
  try {
    const supabase = await createClient()

    let query = supabase.from("service_types").select("*").order("name", { ascending: true })

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data, error } = await query

    if (error) {
      console.warn("Supabase query service_types failed, using fallback:", error.message)
      return {
        success: true,
        message: "Data jenis pelayanan (fallback mode)",
        data: activeOnly ? DEFAULT_SERVICE_TYPES.filter((s) => s.is_active) : DEFAULT_SERVICE_TYPES,
      }
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        message: "Data jenis pelayanan default",
        data: activeOnly ? DEFAULT_SERVICE_TYPES.filter((s) => s.is_active) : DEFAULT_SERVICE_TYPES,
      }
    }

    return {
      success: true,
      message: "Berhasil memuat jenis pelayanan",
      data: data as ServiceType[],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat jenis pelayanan"
    return {
      success: true,
      message,
      data: activeOnly ? DEFAULT_SERVICE_TYPES.filter((s) => s.is_active) : DEFAULT_SERVICE_TYPES,
    }
  }
}

/**
 * Menambahkan jenis pelayanan baru
 */
export async function createServiceTypeAction(
  formData: FormData
): Promise<ServiceTypeActionResult<ServiceType>> {
  try {
    const supabase = await createClient()

    const rawData = {
      name: formData.get("name") as string,
      code: ((formData.get("code") as string) || "").toUpperCase(),
      category: formData.get("category") as string,
      description: (formData.get("description") as string) || null,
      color: (formData.get("color") as string) || "sky",
      is_active: formData.get("is_active") === "true",
    }

    const validation = serviceTypeSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0]?.message || "Data jenis pelayanan tidak valid",
      }
    }

    const { data, error } = await supabase
      .from("service_types")
      .insert([validation.data])
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          message: `Kode pelayanan '${validation.data.code}' sudah digunakan. Silakan gunakan kode lain.`,
        }
      }
      return { success: false, message: `Gagal menyimpan jenis pelayanan: ${error.message}` }
    }

    await recordAuditLog({
      action: "CREATE",
      entity: "service_types",
      recordId: data.id,
      newValues: validation.data,
    })

    revalidatePath("/dashboard/master/jenis-pelayanan")
    revalidatePath("/dashboard/master")

    return {
      success: true,
      message: `Jenis pelayanan '${data.name}' berhasil ditambahkan`,
      data: data as ServiceType,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat jenis pelayanan"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Memperbarui data jenis pelayanan
 */
export async function updateServiceTypeAction(
  id: string,
  formData: FormData
): Promise<ServiceTypeActionResult<ServiceType>> {
  try {
    const supabase = await createClient()

    const rawData = {
      name: formData.get("name") as string,
      code: ((formData.get("code") as string) || "").toUpperCase(),
      category: formData.get("category") as string,
      description: (formData.get("description") as string) || null,
      color: (formData.get("color") as string) || "sky",
      is_active: formData.get("is_active") === "true",
    }

    const validation = serviceTypeSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0]?.message || "Data jenis pelayanan tidak valid",
      }
    }

    const { data, error } = await supabase
      .from("service_types")
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
          message: `Kode pelayanan '${validation.data.code}' sudah digunakan oleh jenis pelayanan lain.`,
        }
      }
      return { success: false, message: `Gagal memperbarui jenis pelayanan: ${error.message}` }
    }

    await recordAuditLog({
      action: "UPDATE",
      entity: "service_types",
      recordId: id,
      newValues: validation.data,
    })

    revalidatePath("/dashboard/master/jenis-pelayanan")
    revalidatePath("/dashboard/master")

    return {
      success: true,
      message: `Jenis pelayanan '${data.name}' berhasil diperbarui`,
      data: data as ServiceType,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui jenis pelayanan"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Menghapus jenis pelayanan
 */
export async function deleteServiceTypeAction(id: string): Promise<ServiceTypeActionResult> {
  try {
    const supabase = await createClient()

    const { data: existing, error: fetchErr } = await supabase
      .from("service_types")
      .select("name, code")
      .eq("id", id)
      .single()

    if (fetchErr || !existing) {
      return { success: false, message: "Jenis pelayanan tidak ditemukan" }
    }

    const { error: delErr } = await supabase.from("service_types").delete().eq("id", id)

    if (delErr) {
      return {
        success: false,
        message: `Gagal menghapus jenis pelayanan: ${delErr.message}. Pastikan tidak terkait dengan ruangan pelayanan aktif.`,
      }
    }

    await recordAuditLog({
      action: "DELETE",
      entity: "service_types",
      recordId: id,
      oldValues: existing,
    })

    revalidatePath("/dashboard/master/jenis-pelayanan")
    revalidatePath("/dashboard/master")

    return {
      success: true,
      message: `Jenis pelayanan '${existing.name}' berhasil dihapus`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus jenis pelayanan"
    return { success: false, message, error: String(err) }
  }
}
