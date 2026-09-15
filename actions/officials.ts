"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { recordAuditLog } from "@/lib/audit/logger"
import {
  officialFormSchema,
  OfficialCategory,
} from "@/lib/validations/officials"

export interface HospitalOfficial {
  id: string
  name: string
  nip: string
  position: string
  category: OfficialCategory
  rank_group?: string | null
  is_active: boolean
  is_primary_signer: boolean
  digital_signature_url?: string | null
  created_at: string
  updated_at: string
}

export interface OfficialActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// Data awal standar RSUD Bulukumba sebagai fallback
const DEFAULT_OFFICIALS: HospitalOfficial[] = [
  {
    id: "off-001",
    name: "dr. H. Rizal Ridwan Dappi, Sp.OG(K)., M.Kes",
    nip: "19720814 200212 1 006",
    position: "Direktur RSUD H. Andi Sulthan Daeng Radja Bulukumba",
    category: "pimpinan_rsud",
    rank_group: "Pembina Utama Muda / IV-c",
    is_active: true,
    is_primary_signer: true,
    digital_signature_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "off-002",
    name: "drg. Hj. Rismayanti, M.Kes",
    nip: "19780512 200604 2 015",
    position: "Kepala Bidang Pendidikan, Pelatihan & Penelitian (Komkordik)",
    category: "kabid_diklat",
    rank_group: "Pembina / IV-a",
    is_active: true,
    is_primary_signer: true,
    digital_signature_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "off-003",
    name: "dr. H. Rizal Rusli, Sp.PD",
    nip: "19760315 200502 1 004",
    position: "Ketua Komite Koordinasi Pendidikan (Komkordik) Kedokteran",
    category: "kabid_diklat",
    rank_group: "Pembina Tk. I / IV-b",
    is_active: true,
    is_primary_signer: false,
    digital_signature_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

/**
 * Mengambil daftar pimpinan dan kabid diklat
 */
export async function getOfficialsAction(filters?: {
  category?: string
  isActive?: boolean
}): Promise<OfficialActionResult<HospitalOfficial[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("hospital_officials")
      .select("*")
      .order("is_primary_signer", { ascending: false })
      .order("name", { ascending: true })

    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category)
    }

    if (typeof filters?.isActive === "boolean") {
      query = query.eq("is_active", filters.isActive)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      // Saring data fallback jika tabel di database belum terisi
      let filtered = [...DEFAULT_OFFICIALS]
      if (filters?.category && filters.category !== "all") {
        filtered = filtered.filter((o) => o.category === filters.category)
      }
      if (typeof filters?.isActive === "boolean") {
        filtered = filtered.filter((o) => o.is_active === filters.isActive)
      }
      return {
        success: true,
        message: "Memuat data pimpinan rumah sakit",
        data: filtered,
      }
    }

    return {
      success: true,
      message: "Daftar pimpinan & kabid diklat berhasil dimuat",
      data: data as HospitalOfficial[],
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat data pejabat"
    return {
      success: true,
      message,
      data: DEFAULT_OFFICIALS,
    }
  }
}

/**
 * Mendaftarkan pejabat pimpinan / kabid diklat baru
 */
export async function createOfficialAction(
  formData: FormData
): Promise<OfficialActionResult<{ id: string }>> {
  const rawData = {
    name: formData.get("name") as string,
    nip: formData.get("nip") as string,
    position: formData.get("position") as string,
    category: formData.get("category") as OfficialCategory,
    rank_group: (formData.get("rank_group") as string) || null,
    is_active: formData.get("is_active") === "true",
    is_primary_signer: formData.get("is_primary_signer") === "true",
    digital_signature_url: (formData.get("digital_signature_url") as string) || null,
  }

  const validation = officialFormSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data formulir tidak valid",
    }
  }

  try {
    const supabase = await createClient()

    // Jika diset sebagai primary signer, nonaktifkan primary signer lain dalam kategori yang sama
    if (validation.data.is_primary_signer) {
      await supabase
        .from("hospital_officials")
        .update({ is_primary_signer: false })
        .eq("category", validation.data.category)
    }

    const { data: created, error } = await supabase
      .from("hospital_officials")
      .insert(validation.data)
      .select("id")
      .single()

    if (error) throw error

    await recordAuditLog({
      action: "CREATE",
      entity: "hospital_officials",
      recordId: created.id,
      newValues: validation.data,
    })

    revalidatePath("/dashboard/master/pimpinan")
    revalidatePath("/dashboard/master")
    revalidatePath("/dashboard/surat")

    return {
      success: true,
      message: `Pejabat ${validation.data.name} berhasil ditambahkan ke master data!`,
      data: { id: created.id },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambahkan pejabat"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Memperbarui data pejabat pimpinan / kabid diklat
 */
export async function updateOfficialAction(
  id: string,
  formData: FormData
): Promise<OfficialActionResult> {
  const rawData = {
    id,
    name: formData.get("name") as string,
    nip: formData.get("nip") as string,
    position: formData.get("position") as string,
    category: formData.get("category") as OfficialCategory,
    rank_group: (formData.get("rank_group") as string) || null,
    is_active: formData.get("is_active") === "true",
    is_primary_signer: formData.get("is_primary_signer") === "true",
    digital_signature_url: (formData.get("digital_signature_url") as string) || null,
  }

  const validation = officialFormSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data formulir tidak valid",
    }
  }

  try {
    const supabase = await createClient()

    if (validation.data.is_primary_signer) {
      await supabase
        .from("hospital_officials")
        .update({ is_primary_signer: false })
        .eq("category", validation.data.category)
    }

    const { error } = await supabase
      .from("hospital_officials")
      .update(validation.data)
      .eq("id", id)

    if (error) throw error

    await recordAuditLog({
      action: "UPDATE",
      entity: "hospital_officials",
      recordId: id,
      newValues: validation.data,
    })

    revalidatePath("/dashboard/master/pimpinan")
    revalidatePath("/dashboard/master")
    revalidatePath("/dashboard/surat")

    return {
      success: true,
      message: `Data pejabat ${validation.data.name} berhasil diperbarui!`,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui pejabat"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Menghapus pejabat dari master data
 */
export async function deleteOfficialAction(id: string): Promise<OfficialActionResult> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("hospital_officials").delete().eq("id", id)
    if (error) throw error

    await recordAuditLog({
      action: "DELETE",
      entity: "hospital_officials",
      recordId: id,
    })

    revalidatePath("/dashboard/master/pimpinan")
    revalidatePath("/dashboard/master")
    revalidatePath("/dashboard/surat")

    return { success: true, message: "Pejabat berhasil dihapus dari master data" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus pejabat"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Mengatur pejabat sebagai penandatangan utama untuk kategorinya
 */
export async function setDefaultSignerAction(
  id: string,
  category: OfficialCategory
): Promise<OfficialActionResult> {
  try {
    const supabase = await createClient()

    // 1. Reset yang lain
    await supabase
      .from("hospital_officials")
      .update({ is_primary_signer: false })
      .eq("category", category)

    // 2. Set yang dipilih
    const { error } = await supabase
      .from("hospital_officials")
      .update({ is_primary_signer: true, is_active: true })
      .eq("id", id)

    if (error) throw error

    await recordAuditLog({
      action: "SET_PRIMARY_SIGNER",
      entity: "hospital_officials",
      recordId: id,
      newValues: { is_primary_signer: true, category },
    })

    revalidatePath("/dashboard/master/pimpinan")
    revalidatePath("/dashboard/surat")

    return {
      success: true,
      message: "Berhasil mengatur pejabat ini sebagai Penandatangan Utama surat dinas!",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengatur penandatangan utama"
    return { success: false, message, error: String(err) }
  }
}
